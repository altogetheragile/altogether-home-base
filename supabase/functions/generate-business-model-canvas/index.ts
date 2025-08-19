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

    const prompt = `You are a world-class business strategy consultant and venture capital advisor with expertise in creating comprehensive Business Model Canvases for Fortune 500 companies and successful startups. 

Analyze this business and create a strategic, industry-specific Business Model Canvas:

**COMPANY PROFILE:**
• Company: ${input.companyName}
• Industry: ${input.industry} 
• Target Market: ${input.targetCustomers}
• Offering: ${input.productService}
• Stage: ${input.businessStage}
${input.additionalContext ? `• Context: ${input.additionalContext}` : ''}

**STRATEGIC FRAMEWORK:**
Apply industry best practices, competitive analysis, and proven business model patterns. Consider market dynamics, technological trends, regulatory environment, and scalability factors specific to the ${input.industry} industry.

**QUALITY REQUIREMENTS:**
- Provide 3-5 strategic, specific, and actionable items per section
- Include real-world examples and industry terminology
- Focus on competitive advantages and differentiation
- Consider both short-term execution and long-term strategic value
- Align all sections for coherent business strategy

**OUTPUT FORMAT:**
Respond with detailed, professional content in this JSON structure:
{
  "keyPartners": "Strategic partnerships with specific types of organizations, suppliers, and stakeholders that will drive competitive advantage",
  "keyActivities": "Critical activities and capabilities that must be executed excellently to deliver the value proposition", 
  "keyResources": "Essential assets, capabilities, and resources required for sustainable competitive advantage",
  "valuePropositions": "Compelling value propositions that solve real customer problems better than alternatives",
  "customerRelationships": "Relationship strategies and engagement models that build loyalty and lifetime value",
  "channels": "Distribution and communication channels optimized for target customer acquisition and retention",
  "customerSegments": "Specific, addressable market segments with distinct needs and characteristics",
  "costStructure": "Major cost drivers and expense categories critical for unit economics and scalability",
  "revenueStreams": "Diversified revenue models and pricing strategies aligned with value delivery"
}

Create content that demonstrates deep industry knowledge and strategic thinking for ${input.companyName}.

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: 'You are a world-class business strategy consultant with expertise from McKinsey, BCG, and successful venture capital firms. You create Business Model Canvases that have helped companies raise millions in funding and scale successfully. Always respond with valid JSON format containing strategic, actionable insights.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2500,
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