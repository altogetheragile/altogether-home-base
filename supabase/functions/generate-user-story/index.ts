import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
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
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
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

  // Get user from auth header (optional - supports anonymous)
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  let user = null;
  
  if (token) {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && authUser) {
      user = authUser;
    }
  }
  
  const isAnonymous = !user;

  // Get request metadata for audit
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  let rawRequest: GenerateStoryRequest;
  let storyLevel: StoryLevel = 'story';
  
  try {
    rawRequest = await req.json();
    storyLevel = rawRequest.storyLevel || 'story';
    
    // Check rate limits based on user type
    let rateLimitOk = false;
    
    if (isAnonymous) {
      // Anonymous users: 3 requests per 24 hours by IP
      const { data, error: rateLimitError } = await supabase.rpc('check_anonymous_ai_rate_limit', {
        p_ip_address: ipAddress,
        p_endpoint: 'generate-user-story',
        p_max_requests: 3,
        p_window_hours: 24
      });
      
      if (rateLimitError) {
        console.error('Anonymous rate limit check failed:', rateLimitError);
      } else {
        rateLimitOk = data || false;
      }
      
      if (!rateLimitOk) {
        await supabase.from('ai_generation_audit').insert({
          user_id: null,
          is_anonymous: true,
          story_level: storyLevel,
          input_data: { error: 'rate_limit_exceeded' },
          success: false,
          error_message: 'Free generation limit reached. Sign in for unlimited access.',
          ip_address: ipAddress,
          user_agent: userAgent,
          execution_time_ms: Date.now() - startTime
        });
        
        return new Response(JSON.stringify({ 
          error: 'ANONYMOUS_LIMIT_REACHED',
          message: 'You have used all 3 free AI generations. Sign in for unlimited access!'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Authenticated users: 50 requests per hour
      const { data, error: rateLimitError } = await supabase.rpc('check_ai_rate_limit', {
        p_user_id: user.id,
        p_endpoint: 'generate-user-story',
        p_max_requests: 50,
        p_window_minutes: 60
      });

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
      } else {
        rateLimitOk = data || false;
      }
      
      if (!rateLimitOk) {
        await supabase.from('ai_generation_audit').insert({
          user_id: user.id,
          is_anonymous: false,
          story_level: storyLevel,
          input_data: { error: 'rate_limit_exceeded' },
          success: false,
          error_message: 'Rate limit exceeded. Please try again later.',
          ip_address: ipAddress,
          user_agent: userAgent,
          execution_time_ms: Date.now() - startTime
        });
        
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. You can make up to 50 requests per hour. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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

    // Audit log successful generation
    await supabase.from('ai_generation_audit').insert({
      user_id: user?.id || null,
      is_anonymous: isAnonymous,
      story_level: storyLevel,
      input_data: sanitizedRequest,
      output_data: result,
      token_count: tokenValidation.tokenCount,
      execution_time_ms: executionTime,
      success: true,
      ip_address: ipAddress,
      user_agent: userAgent
    });

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
    logPromptMetrics(storyLevel, 0, executionTime, false);
    
    // Audit log failed generation
    await supabase.from('ai_generation_audit').insert({
      user_id: user?.id || null,
      is_anonymous: isAnonymous,
      story_level: storyLevel,
      input_data: rawRequest || {},
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
      execution_time_ms: executionTime,
      ip_address: ipAddress,
      user_agent: userAgent
    });
    
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