import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Text processing utilities for BMC content
const cleanupText = (text: string): string => {
  if (!text) return text;
  
  return text
    // Fix missing spaces after periods
    .replace(/\.([A-Z])/g, '. $1')
    // Fix missing spaces after commas
    .replace(/,([A-Z])/g, ', $1')
    // Fix missing spaces after colons
    .replace(/:([A-Z])/g, ': $1')
    // Fix missing spaces between words (basic pattern)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Fix multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
};

const validateSpacing = (text: string): boolean => {
  if (!text) return true;
  
  // Check for common spacing issues
  const hasProperPeriodSpacing = !text.includes(/\.[A-Z]/.test(text));
  const hasProperCommaSpacing = !text.includes(/,[A-Z]/.test(text));
  const noDoubleSpaces = !text.includes('  ');
  
  return hasProperPeriodSpacing && hasProperCommaSpacing && noDoubleSpaces;
};

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
  return `You are an expert business strategist specializing in Business Model Canvas creation.

MANDATORY TEXT FORMATTING REQUIREMENTS:
- ALWAYS add proper spaces after periods (. ), commas (, ), and colons (: )
- NEVER concatenate words together
- Each sentence must have proper spacing between all words
- Use clear, readable formatting with proper punctuation spacing

INCORRECT EXAMPLES TO AVOID:
❌ "Centralized kitchen and meal prep facilities with specialized equipment for bulk healthy food preparation.,A proprietary digital platform"
❌ "Strong supplier relationships for consistent access to premium ingredients and sustainable packaging.,Brand assets"

CORRECT EXAMPLES TO FOLLOW:
✅ "Centralized kitchen and meal prep facilities with specialized equipment for bulk healthy food preparation. A proprietary digital platform handling meal customization and subscription management."
✅ "Strong supplier relationships for consistent access to premium ingredients and sustainable packaging. Brand assets and marketing collateral tailored to health focus."

STEP-BY-STEP INSTRUCTIONS:
1. Generate content for each BMC section
2. Review each sentence for proper spacing after punctuation
3. Ensure no words are concatenated together
4. Add proper spaces between all words and after punctuation marks
5. Double-check formatting before finalizing

Company Details:
- Company: ${input.companyName || 'Unnamed Company'}
- Industry: ${input.industry || 'Not specified'}
- Description: ${input.description || 'No description provided'}
- Target Audience: ${input.targetAudience || 'Not specified'}
- Business Model: ${input.businessModel || 'Not specified'}
- Additional Context: ${input.additionalContext || 'None'}

Generate comprehensive Business Model Canvas content with 3-5 detailed points for each section.

FINAL CHECK: Before submitting, verify that:
- Every period is followed by a space before the next word
- Every comma is followed by a space before the next word
- No words are concatenated together
- All sentences are properly formatted and readable

Return as JSON with these exact keys:
- keyPartners
- keyActivities  
- keyResources
- valuePropositions
- customerRelationships
- channels
- customerSegments
- costStructure
- revenueStreams`;
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
        model: 'gpt-4-1106-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Generated content length:', generatedContent?.length);
    console.log('Generated content preview:', generatedContent?.substring(0, 200));

    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
      
      // Apply post-processing for BMC content
      if (input.type === 'bmc' && parsedContent) {
        console.log('Applying text cleanup for BMC content...');
        
        // Clean up all BMC sections
        const bmcKeys = ['keyPartners', 'keyActivities', 'keyResources', 'valuePropositions', 
                        'customerRelationships', 'channels', 'customerSegments', 'costStructure', 'revenueStreams'];
        
        for (const key of bmcKeys) {
          if (parsedContent[key]) {
            const original = parsedContent[key];
            parsedContent[key] = cleanupText(original);
            
            if (original !== parsedContent[key]) {
              console.log(`Cleaned up ${key}: "${original}" -> "${parsedContent[key]}"`);
            }
            
            // Validate spacing
            if (!validateSpacing(parsedContent[key])) {
              console.warn(`Spacing validation failed for ${key}: "${parsedContent[key]}"`);
            }
          }
        }
      }
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