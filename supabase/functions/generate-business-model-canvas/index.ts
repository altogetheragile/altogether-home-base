import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BMCInput {
  companyName: string;
  industry: string;
  targetCustomers: string;
  productService: string;
  businessStage: string;
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const input: BMCInput = await req.json();
    console.log('Generating BMC for:', input.companyName);

    const systemPrompt = 'You are a world-class business strategy consultant. Always respond with valid JSON only. Use simple bullet points and newlines in your text content.';
    
    const userPrompt = 'Create a Business Model Canvas for:\n' + 
      'Company: ' + input.companyName + '\n' +
      'Industry: ' + input.industry + '\n' +
      'Target: ' + input.targetCustomers + '\n' +
      'Product: ' + input.productService + '\n' +
      'Stage: ' + input.businessStage + '\n' +
      (input.additionalContext ? 'Context: ' + input.additionalContext + '\n' : '') +
      '\nReturn only this JSON format:\n' +
      '{"keyPartners":"content","keyActivities":"content","keyResources":"content","valuePropositions":"content","customerRelationships":"content","channels":"content","customerSegments":"content","costStructure":"content","revenueStreams":"content"}';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error('OpenAI API failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    console.log('Raw AI response:', content);

    // Parse JSON response
    let bmcData: BMCOutput;
    try {
      bmcData = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', content);
      
      // Fallback: create a basic BMC structure
      bmcData = {
        keyPartners: 'AI response parsing failed',
        keyActivities: 'Please try again',
        keyResources: 'Generation incomplete',
        valuePropositions: 'Unable to parse AI response',
        customerRelationships: 'Please regenerate',
        channels: 'Try different inputs',
        customerSegments: 'Parsing error occurred',
        costStructure: 'Technical issue',
        revenueStreams: 'Please retry generation'
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: bmcData,
      companyName: input.companyName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-business-model-canvas function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});