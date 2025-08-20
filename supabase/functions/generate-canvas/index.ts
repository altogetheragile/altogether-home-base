import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanvasInput {
  type: 'bmc' | 'user-story-map' | 'customer-journey' | 'process-flow';
  companyName?: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  businessModel?: string;
  additionalContext?: string;
}

interface BMCOutput {
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;
}

const generateBMCPrompt = (input: CanvasInput): string => {
  return `You are an expert business strategist. Generate a comprehensive Business Model Canvas for the following company:

Company: ${input.companyName || 'Unnamed Company'}
Industry: ${input.industry || 'Not specified'}
Description: ${input.description || 'No description provided'}
Target Audience: ${input.targetAudience || 'Not specified'}
Business Model: ${input.businessModel || 'Not specified'}
Additional Context: ${input.additionalContext || 'None'}

Please provide detailed, specific, and actionable content for each of the 9 Business Model Canvas sections. Each section should contain 3-5 bullet points or detailed descriptions.

Return your response as a JSON object with exactly these keys:
- keyPartners
- keyActivities  
- keyResources
- valuePropositions
- customerRelationships
- channels
- customerSegments
- costStructure
- revenueStreams

Make each section comprehensive and industry-specific. Avoid generic responses.`;
};

const generateUserStoryMapPrompt = (input: CanvasInput): string => {
  return `Generate a user story map for: ${input.companyName}
Industry: ${input.industry}
Description: ${input.description}

Create a hierarchical user story map with epics, user stories, and tasks.
Return as JSON with structure: { epics: [{ name, stories: [{ title, tasks: [] }] }] }`;
};

const generateCustomerJourneyPrompt = (input: CanvasInput): string => {
  return `Generate a customer journey map for: ${input.companyName}
Target Audience: ${input.targetAudience}
Industry: ${input.industry}

Create journey stages with touchpoints, emotions, and pain points.
Return as JSON with structure: { stages: [{ name, touchpoints: [], emotions: [], painPoints: [] }] }`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const input: CanvasInput = await req.json();
    
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (input.type) {
      case 'bmc':
        systemPrompt = 'You are an expert business strategist specializing in Business Model Canvas creation.';
        userPrompt = generateBMCPrompt(input);
        break;
      case 'user-story-map':
        systemPrompt = 'You are an expert product manager specializing in user story mapping.';
        userPrompt = generateUserStoryMapPrompt(input);
        break;
      case 'customer-journey':
        systemPrompt = 'You are an expert UX researcher specializing in customer journey mapping.';  
        userPrompt = generateCustomerJourneyPrompt(input);
        break;
      default:
        throw new Error(`Unsupported canvas type: ${input.type}`);
    }

    console.log('Generating canvas with OpenAI...', { type: input.type, company: input.companyName });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content:', generatedContent);

    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw content:', generatedContent);
      
      // Fallback for BMC
      if (input.type === 'bmc') {
        parsedContent = {
          keyPartners: "Key partners and suppliers to be identified",
          keyActivities: "Core activities to be defined", 
          keyResources: "Essential resources to be determined",
          valuePropositions: "Value propositions to be developed",
          customerRelationships: "Customer relationship strategies to be established",
          channels: "Distribution and communication channels to be selected",
          customerSegments: "Target customer segments to be identified",
          costStructure: "Cost structure to be analyzed",
          revenueStreams: "Revenue streams to be developed"
        };
      } else {
        throw new Error('Failed to parse generated content');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsedContent,
      type: input.type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-canvas function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});