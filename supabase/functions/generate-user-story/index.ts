import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserStoryRequest {
  feature: string;
  userRole?: string;
  goal?: string;
  context?: string;
}

interface UserStoryResponse {
  title: string;
  story: string;
  acceptanceCriteria: string[];
  priority: string;
  storyPoints: number;
  epic?: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!openAIApiKey) {
    console.error('OpenAI API key not configured');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { feature, userRole = "user", goal, context }: UserStoryRequest = await req.json();

    if (!feature) {
      return new Response(JSON.stringify({ error: 'Feature description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating user story for:', { feature, userRole, goal, context });

    const prompt = `Generate a well-structured user story for the following feature:

Feature: ${feature}
User Role: ${userRole}
${goal ? `Goal: ${goal}` : ''}
${context ? `Context: ${context}` : ''}

Please create a comprehensive user story with the following structure:
- A clear, concise title
- A properly formatted user story following the "As a [user], I want [feature], so that [benefit]" format
- Acceptance criteria as a list of testable requirements (3-5 criteria)
- Priority level (High, Medium, Low) based on business value
- Story points estimate (1, 2, 3, 5, 8, 13) based on complexity
- Suggested epic category if applicable
- Initial status (typically "To Do")

Return the response as a JSON object with the following structure:
{
  "title": "Brief descriptive title",
  "story": "As a [user role], I want [feature] so that [benefit]",
  "acceptanceCriteria": ["Given... When... Then...", "..."],
  "priority": "High|Medium|Low",
  "storyPoints": number,
  "epic": "Epic category (optional)",
  "status": "To Do"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert product manager and agile coach. Generate well-structured user stories with clear acceptance criteria and appropriate estimations. Always respond with valid JSON only. Do not include any text before or after the JSON object.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    console.log('Generated content:', generatedContent);

    if (!generatedContent) {
      console.error('Empty response from OpenAI:', data);
      throw new Error('Empty response from OpenAI API');
    }

    // Parse the JSON response
    let userStory: UserStoryResponse;
    try {
      userStory = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Invalid response format from AI');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: userStory 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-user-story function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});