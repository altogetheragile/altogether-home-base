import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://altogether-home-base.lovable.app",
  "https://preview--altogether-home-base.lovable.app"
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
  };
}

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

// Post-processing function to fix spacing issues
function cleanupText(text: string): string {
  return text
    // Fix missing spaces after periods
    .replace(/\.([A-Z])/g, '. $1')
    // Fix missing spaces after commas
    .replace(/,([A-Za-z])/g, ', $1')
    // Fix concatenated words (capital letter following lowercase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Fix multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

// Validate text has proper spacing
function validateSpacing(text: string): boolean {
  // Check for concatenated words (lowercase followed by uppercase without space)
  const hasSpacingIssues = /[a-z][A-Z]/.test(text);
  // Check for missing spaces after punctuation
  const hasPunctuationIssues = /[.,;:][A-Za-z]/.test(text);
  
  return !hasSpacingIssues && !hasPunctuationIssues;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const input: BMCInput = await req.json();
    console.log('Generating BMC for:', input.companyName);

    const systemPrompt = `You are a world-class business strategy consultant. MANDATORY: Always respond with valid JSON only.

CRITICAL SPACING AND PUNCTUATION REQUIREMENTS - FAILURE TO FOLLOW WILL RESULT IN REJECTION:

1. MANDATORY: Every single word must be separated by exactly one space
2. MANDATORY: Every sentence must end with proper punctuation followed by a space
3. MANDATORY: Every comma must be followed by exactly one space
4. MANDATORY: Never concatenate words together without spaces

STEP-BY-STEP CHECKLIST YOU MUST FOLLOW:
1. Write each sentence with proper spacing between every word
2. Add a period at the end of each sentence followed by a space
3. Ensure commas are followed by spaces
4. Double-check that no words are stuck together
5. Verify each section reads naturally when spoken aloud

EXAMPLES OF CORRECT FORMATTING:
✅ CORRECT: "Strategic partnerships with technology providers, food suppliers, and logistics companies. These relationships enable scalable operations, cost efficiency, and quality assurance."

❌ WRONG: "Strategicpartnershipswithmissionproviders,foodsuppliers,andlogisticscompanies.Theserelationshipsenablescalableoperations,costefficiency,andqualityassurance."

✅ CORRECT: "Digital platform development, menu curation, supply chain management, and customer relationship management."

❌ WRONG: "Digitalplatformdevelopment,menucuration,supplychainmanagement,andcustomerrelationshipmanagement."

FINAL CHECK: Before responding, read each sentence out loud mentally. If it doesn't sound natural, fix the spacing.

Remember: You are generating content for a professional business document. Every word must be clearly separated and readable.`;
    
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
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1500
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
      const rawBmcData = JSON.parse(content);
      
      // Apply cleanup to all fields and validate spacing
      bmcData = {
        keyPartners: cleanupText(rawBmcData.keyPartners || ''),
        keyActivities: cleanupText(rawBmcData.keyActivities || ''),
        keyResources: cleanupText(rawBmcData.keyResources || ''),
        valuePropositions: cleanupText(rawBmcData.valuePropositions || ''),
        customerRelationships: cleanupText(rawBmcData.customerRelationships || ''),
        channels: cleanupText(rawBmcData.channels || ''),
        customerSegments: cleanupText(rawBmcData.customerSegments || ''),
        costStructure: cleanupText(rawBmcData.costStructure || ''),
        revenueStreams: cleanupText(rawBmcData.revenueStreams || '')
      };
      
      // Validate spacing in all fields
      const allFields = Object.values(bmcData);
      const hasSpacingIssues = allFields.some(field => !validateSpacing(field));
      
      if (hasSpacingIssues) {
        console.warn('Spacing issues detected in generated content, but proceeding with cleaned version');
        console.log('Cleaned BMC data:', bmcData);
      } else {
        console.log('Generated content passed spacing validation');
      }
      
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
      headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
    });

  } catch (error) {
    console.error('Error in generate-business-model-canvas function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
    });
  }
});