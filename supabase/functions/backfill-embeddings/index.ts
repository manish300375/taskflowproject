import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: tasks, error: fetchError } = await supabase
      .from("tasks")
      .select("id, title, description, embedding")
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("Error fetching tasks:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch tasks", details: fetchError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const model = new Supabase.ai.Session("gte-small");
    let updatedCount = 0;
    const errors = [];

    for (const task of tasks || []) {
      if (task.embedding) {
        continue;
      }

      try {
        const textToEmbed = task.description
          ? `${task.title} ${task.description}`
          : task.title;

        const embedding = await model.run(textToEmbed, { mean_pool: true, normalize: true });

        const { error: updateError } = await supabase
          .from("tasks")
          .update({ embedding: JSON.stringify(embedding) })
          .eq("id", task.id);

        if (updateError) {
          errors.push({ taskId: task.id, error: updateError.message });
        } else {
          updatedCount++;
        }
      } catch (error) {
        errors.push({ taskId: task.id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} tasks`,
        updatedCount,
        totalTasks: tasks?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
