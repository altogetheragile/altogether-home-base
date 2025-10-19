import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { StoryLevel, PromptContext } from "../_shared/prompt-templates.ts";
import { buildPrompt, getSystemPrompt } from "../_shared/prompt-templates.ts";
import { 
  sanitizeObject, 
  validateTokenLimit, 
  validateRequiredFields,
  formatValidationErrors,
  extractJSON,
  logPromptMetrics 
} from "../_shared/prompt-utils.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateStoryRequest {
  storyLevel: StoryLevel;
  userInput: string;
  parentContext?: {
    level: StoryLevel;
    title: string;
    description?: string;
    businessObjective?: string;
    userValue?: string;
  };
  additionalFields?: {
    userRole?: string;
    goal?: string;
    context?: string;
  };
  parentId?: string;
}

serve(async (req) => {
  const startTime = Date.now();
  
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
    const rawRequest: GenerateStoryRequest = await req.json();

    // Sanitize all input fields
    const sanitizedRequest = sanitizeObject(rawRequest);
    const { storyLevel, userInput, parentContext, additionalFields, parentId } = sanitizedRequest;

    // Validate required fields
    const validation = validateRequiredFields(storyLevel, userInput, parentId);
    if (!validation.valid) {
      const errorMessage = formatValidationErrors(validation.errors);
      console.error('Validation failed:', errorMessage);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context-aware prompt
    const promptContext: PromptContext = {
      storyLevel,
      userInput,
      parentContext,
      additionalFields,
    };
    
    const prompt = buildPrompt(promptContext);
    const systemPrompt = getSystemPrompt(storyLevel);

    // Validate token limits
    const combinedPrompt = `${systemPrompt}\n\n${prompt}`;
    const tokenValidation = validateTokenLimit(combinedPrompt, 3500);
    if (!tokenValidation.valid) {
      console.error('Token limit exceeded:', tokenValidation.message);
      return new Response(JSON.stringify({ error: tokenValidation.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating ${storyLevel} with ${tokenValidation.tokenCount} tokens`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1200,
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

    if (!generatedContent) {
      console.error('Empty response from OpenAI:', data);
      throw new Error('Empty response from OpenAI API');
    }

    // Extract and parse JSON with validation
    const result = extractJSON(generatedContent);
    
    const executionTime = Date.now() - startTime;
    logPromptMetrics(storyLevel, tokenValidation.tokenCount, executionTime, true);

    console.log(`Successfully generated ${storyLevel} in ${executionTime}ms`);

    return new Response(JSON.stringify({ 
      success: true, 
      data: result,
      metadata: {
        level: storyLevel,
        tokenCount: tokenValidation.tokenCount,
        executionTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const storyLevel = (await req.json().catch(() => ({})))?.storyLevel || 'unknown';
    logPromptMetrics(storyLevel, 0, executionTime, false);
    
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