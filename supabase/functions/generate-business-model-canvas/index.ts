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
- Use simple bullet points (•) followed by concise descriptions
- Avoid complex formatting, special characters, or nested structures
- Focus on competitive advantages and differentiation
- Consider both short-term execution and long-term strategic value
- Align all sections for coherent business strategy

**OUTPUT FORMAT:**
Respond with detailed, professional content in this exact JSON structure with clean formatting:
{
  "keyPartners": "• Strategic partnership type 1\\n• Strategic partnership type 2\\n• Strategic partnership type 3",
  "keyActivities": "• Critical activity 1\\n• Critical activity 2\\n• Critical activity 3", 
  "keyResources": "• Essential resource 1\\n• Essential resource 2\\n• Essential resource 3",
  "valuePropositions": "• Compelling value proposition 1\\n• Compelling value proposition 2\\n• Compelling value proposition 3",
  "customerRelationships": "• Relationship strategy 1\\n• Relationship strategy 2\\n• Relationship strategy 3",
  "channels": "• Distribution channel 1\\n• Distribution channel 2\\n• Distribution channel 3",
  "customerSegments": "• Specific market segment 1\\n• Specific market segment 2\\n• Specific market segment 3",
  "costStructure": "• Major cost driver 1\\n• Major cost driver 2\\n• Major cost driver 3",
  "revenueStreams": "• Revenue model 1\\n• Revenue model 2\\n• Revenue model 3"
}

CRITICAL: Use only simple bullet points (•), newlines (\\n), and basic text. No special formatting, quotes within text, or complex characters.

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
            content: 'You are a world-class business strategy consultant with expertise from McKinsey, BCG, and successful venture capital firms. You create Business Model Canvases that have helped companies raise millions in funding and scale successfully. Always respond with valid JSON format containing strategic, actionable insights. Use simple formatting with bullet points and newlines only.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('OpenAI API error: ' + response.status + ' - ' + error);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated BMC content:', generatedContent);

    // Clean and parse the JSON response
    let bmcData: BMCOutput;
    try {
      // Remove markdown code blocks and clean content
      let cleanedContent = generatedContent.trim();
      
      // Define markdown patterns without using backticks in source code
      const backtick = String.fromCharCode(96); // backtick character
      const jsonCodeBlock = backtick + backtick + backtick + 'json';
      const codeBlock = backtick + backtick + backtick;
      
      // Remove markdown code blocks using string methods
      if (cleanedContent.includes(jsonCodeBlock)) {
        const start = cleanedContent.indexOf(jsonCodeBlock);
        const end = cleanedContent.lastIndexOf(codeBlock);
        if (start !== -1 && end !== -1 && end > start) {
          cleanedContent = cleanedContent.substring(start + jsonCodeBlock.length, end).trim();
        }
      } else if (cleanedContent.includes(codeBlock)) {
        const start = cleanedContent.indexOf(codeBlock);
        const end = cleanedContent.lastIndexOf(codeBlock);
        if (start !== -1 && end !== -1 && end > start) {
          cleanedContent = cleanedContent.substring(start + codeBlock.length, end).trim();
        }
      }
      
      // Clean up any remaining formatting issues
      cleanedContent = cleanedContent.trim();
      
      // Handle bullet points and newlines that might cause JSON parsing issues
      const lines = cleanedContent.split('\n');
      const cleanedLines = lines.map(line => {
        // Escape problematic characters in JSON strings
        return line.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
      });
      cleanedContent = cleanedLines.join('\n');
      
      console.log('Cleaned content for parsing:', cleanedContent.substring(0, 200) + '...');
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