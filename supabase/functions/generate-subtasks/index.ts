import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { taskTitle } = await req.json()

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'Task title is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Break down the main task provided as "{{PARENT_TASK_TITLE}}" into a list of 5 to 7 practical, concise subtasks written in plain language. Subtasks should cover the essential steps needed to complete the main task. Return the subtasks as a plain JSON array, without any additional explanations, text, or formatting. Each subtask should be clear, specific, and actionable.

Output format: A single JSON array with each subtask as a string element.

Example:
Input: Plan a wedding
Output:
["Book wedding venue", "Hire photographer", "Send invitations", "Arrange catering", "Plan wedding ceremony", "Choose wedding dress", "Plan honeymoon"]

(For real tasks, substitute the task title and subtasks as appropriate. Outputs should be short, direct, and focused on completion steps.)

REMINDER: Your main objectives are to generate 5–7 clear, actionable subtasks for the given task, written in plain language, and return them in a JSON array with no extra explanation or formatting.`
          },
          {
            role: 'user',
            content: taskTitle
          }
        ],
        response_format: {
          type: 'text'
        },
        temperature: 1,
        max_completion_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to generate subtasks' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    const subtasksText = data.choices[0]?.message?.content

    if (!subtasksText) {
      return new Response(
        JSON.stringify({ error: 'No subtasks generated' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    try {
      // Parse the JSON array from the response
      const subtasks = JSON.parse(subtasksText.trim())
      
      if (!Array.isArray(subtasks)) {
        throw new Error('Response is not an array')
      }

      return new Response(
        JSON.stringify({ subtasks }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch (parseError) {
      console.error('Failed to parse subtasks:', parseError)
      return new Response(
        JSON.stringify({ error: 'Failed to parse generated subtasks' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in generate-subtasks function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})