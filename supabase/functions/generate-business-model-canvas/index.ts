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

    const prompt = `You are a business strategy consultant expert in creating Business Model Canvases. Generate a comprehensive Business Model Canvas for the following company:

Company: ${input.companyName}
Industry: ${input.industry}
Target Customers: ${input.targetCustomers}
Product/Service: ${input.productService}
Business Stage: ${input.businessStage}
${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ''}

Create a detailed Business Model Canvas with specific, actionable content for each of the 9 building blocks. Provide 2-4 bullet points per section. Be specific to this industry and business context.

Respond in valid JSON format with this exact structure:
{
  "keyPartners": "• Partner 1\n• Partner 2\n• Partner 3",
  "keyActivities": "• Activity 1\n• Activity 2\n• Activity 3",
  "keyResources": "• Resource 1\n• Resource 2\n• Resource 3",
  "valuePropositions": "• Value Prop 1\n• Value Prop 2\n• Value Prop 3",
  "customerRelationships": "• Relationship 1\n• Relationship 2\n• Relationship 3",
  "channels": "• Channel 1\n• Channel 2\n• Channel 3",
  "customerSegments": "• Segment 1\n• Segment 2\n• Segment 3",
  "costStructure": "• Cost 1\n• Cost 2\n• Cost 3",
  "revenueStreams": "• Revenue 1\n• Revenue 2\n• Revenue 3"
}

Make sure each section is relevant, specific, and actionable for ${input.companyName} in the ${input.industry} industry.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a business strategy expert specializing in Business Model Canvas creation. Always respond with valid JSON format.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated BMC content:', generatedContent);

    // Clean and parse the JSON response
    let bmcData: BMCOutput;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = generatedContent.trim();
      
      // Check if content is wrapped in markdown code blocks
      if (cleanedContent.startsWith('```json') && cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(7, -3).trim(); // Remove ```json and ```
      } else if (cleanedContent.startsWith('```') && cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(3, -3).trim(); // Remove ``` and ```
      }
      
      console.log('Cleaned content for parsing:', cleanedContent);
      bmcData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Original content:', generatedContent);
      throw new Error('Invalid JSON response from AI');
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