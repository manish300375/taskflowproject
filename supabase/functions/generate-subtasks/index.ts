import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SubtaskItem {
  [key: string]: string;
}

interface OpenAIResponse {
  subtasks: SubtaskItem[];
}

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
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { taskId, taskTitle } = await req.json();

    if (!taskId || !taskTitle) {
      return new Response(JSON.stringify({ error: "Missing taskId or taskTitle" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("id, user_id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!task) {
      return new Response(JSON.stringify({ error: "Task not found or unauthorized" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingSubtasks } = await supabase
      .from("subtasks")
      .select("id")
      .eq("task_id", taskId);

    if (existingSubtasks && existingSubtasks.length > 0) {
      return new Response(
        JSON.stringify({ message: "Subtasks already generated for this task" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          {
            role: "developer",
            content:
              'You are a helpful assistant and expert planner and organizer. You will get input as a task and you have to understand the intent and then give a list of possible subtasks to be carried out to achieve the task as a clean JSON array.\n\nKeep subtasks limited to 5-6.\nEach subtask should be 3-4 words.\n\nFor example, for a task like "Trip to Malaysia" output would be:\n{\n  "subtasks": [\n    {"sub 1": "Book Hotel"},\n    {"sub 2": "Book Flights"},\n    {"sub 3": "Plan Itinerary"},\n    {"sub 4": "Apply Visa"},\n    {"sub 5": "Book Taxi"},\n    {"sub 6": "Do Packing"},\n    {"sub 7": "Web Checkin"}\n  ]\n}',
          },
          {
            role: "user",
            content: taskTitle,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate subtasks from OpenAI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0].message.content;
    const parsedContent: OpenAIResponse = JSON.parse(content);

    const subtasksToInsert = parsedContent.subtasks.map((item, index) => {
      const subtaskTitle = Object.values(item)[0];
      return {
        task_id: taskId,
        title: subtaskTitle,
        completed: false,
        order: index,
      };
    });

    const { error: insertError } = await supabase
      .from("subtasks")
      .insert(subtasksToInsert);

    if (insertError) {
      console.error("Error inserting subtasks:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save subtasks" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, subtasksCount: subtasksToInsert.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-subtasks function:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorStack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
