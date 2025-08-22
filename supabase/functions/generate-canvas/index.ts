import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Text processing utilities for BMC content
const cleanupText = (text: string | string[] | any): string => {
  if (!text) return '';
  
  let textToProcess: string;
  
  // Handle arrays by preserving bullet structure
  if (Array.isArray(text)) {
    console.log(`Processing array with ${text.length} items:`, text);
    const processedItems = text
      .map(item => {
        const cleanItem = String(item).trim();
        // Ensure each item starts with a bullet point
        return cleanItem.startsWith('•') ? cleanItem : `• ${cleanItem}`;
      })
      .filter(item => item.length > 2); // Filter out items that are just bullets
    
    // Return the joined string directly for arrays - no further cleanup needed
    const result = processedItems.join('\n');
    console.log(`Array converted to string: "${result.substring(0, 100)}..."`);
    return result;
  } else {
    textToProcess = String(text);
  }
  
  console.log(`Original text: "${textToProcess}"`);
  
  // MINIMAL cleanup - only fix obvious issues, don't touch properly spaced text
  const cleaned = textToProcess
    // Only fix missing spaces after periods followed immediately by capital letters
    .replace(/\.([A-Z])/g, '. $1')
    // Only fix missing spaces after commas followed immediately by capital letters  
    .replace(/,([A-Z])/g, ', $1')
    // Fix multiple spaces but preserve intentional spacing
    .replace(/\s{2,}/g, ' ')
    // Trim only leading/trailing whitespace
    .trim();
  
  console.log(`Cleaned text: "${cleaned}"`);
  
  // Only return cleaned if it actually fixed something, otherwise return original
  return cleaned !== textToProcess ? cleaned : textToProcess;
};

const validateSpacing = (text: string): boolean => {
  if (!text) return true;
  
  // Check for common spacing issues using proper regex testing
  const hasProperPeriodSpacing = !/\.[A-Z]/.test(text);
  const hasProperCommaSpacing = !/,[A-Z]/.test(text);
  const noDoubleSpaces = !text.includes('  ');
  
  return hasProperPeriodSpacing && hasProperCommaSpacing && noDoubleSpaces;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanvasInput {
  canvasType: string;
  businessDescription?: string;
  targetAudience?: string;
  keyObjectives?: string[];
  [key: string]: any;
}

interface BMCOutput {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

interface StoryAnalysisInput {
  storyType: 'epic' | 'feature' | 'story';
  title: string;
  description?: string;
  analysisType: 'spidr' | 'split' | 'combine' | 'refine' | 'acceptance_criteria';
  relatedStories?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

interface StoryAnalysisOutput {
  analysisType: string;
  suggestions: string[];
  acceptanceCriteria?: string[];
  refinementQuestions?: string[];
  splitStories?: Array<{
    title: string;
    description: string;
    acceptanceCriteria: string[];
  }>;
  spidrAnalysis?: {
    spike: string[];
    path: string[];
    interface: string[];
    data: string[];
    rules: string[];
  };
}

function generateBMCPrompt(input: CanvasInput): string {
  return `Generate a Business Model Canvas for: ${input.businessDescription}
Target Audience: ${input.targetAudience}
Key Objectives: ${input.keyObjectives?.join(', ') || 'Not specified'}

Please provide a comprehensive Business Model Canvas with all 9 building blocks:
1. Key Partners - Who are the key partners and suppliers?
2. Key Activities - What key activities does the value proposition require?
3. Key Resources - What key resources does the value proposition require?
4. Value Propositions - What value do we deliver to customers?
5. Customer Relationships - What type of relationship does each customer segment expect?
6. Channels - Through which channels do our customer segments want to be reached?
7. Customer Segments - For whom are we creating value?
8. Cost Structure - What are the most important costs inherent in the business model?
9. Revenue Streams - For what value are customers really willing to pay?

Return as JSON format matching the BMCOutput interface.`;
}

function generateUserStoryMapPrompt(input: CanvasInput): string {
  return `Create a User Story Map for: ${input.businessDescription}
Target Users: ${input.targetAudience}

Generate a hierarchical user story map with:
1. User Activities (high-level goals)
2. User Tasks (steps to achieve goals)
3. User Stories (specific functionality)

Format as a structured breakdown with priorities and dependencies.`;
}

function generateCustomerJourneyPrompt(input: CanvasInput): string {
  return `Create a Customer Journey Map for: ${input.businessDescription}
Target Customer: ${input.targetAudience}

Map the customer journey across:
1. Awareness - How do customers discover us?
2. Consideration - How do they evaluate options?
3. Purchase - How do they buy from us?
4. Onboarding - How do they get started?
5. Usage - How do they use our product/service?
6. Support - How do we help them when needed?
7. Advocacy - How do they become promoters?

Include touchpoints, emotions, pain points, and opportunities at each stage.`;
}

function generateStoryAnalysisPrompt(input: StoryAnalysisInput): string {
  const baseContext = `Story Type: ${input.storyType}
Title: ${input.title}
Description: ${input.description || 'Not provided'}`;

  switch (input.analysisType) {
    case 'spidr':
      return `${baseContext}

Perform a SPIDR analysis to break down this ${input.storyType} into clear components:

**SPIDR Framework:**
- **S**pike: What research, proof-of-concepts, or unknowns need investigation?
- **P**ath: What is the happy path user journey and main flow?
- **I**nterface: What UI/UX elements, screens, or user interactions are needed?
- **D**ata: What data needs to be stored, retrieved, validated, or processed?
- **R**ules: What business rules, validations, constraints, or logic apply?

Provide specific, actionable items for each category that will help break this down into implementable user stories.

Return as JSON format matching the StoryAnalysisOutput interface with spidrAnalysis populated.`;

    case 'split':
      return `${baseContext}

This ${input.storyType} appears to be too large or complex. Suggest how to split it into smaller, more manageable user stories.

Consider:
- Independent value delivery
- Testable increments
- Clear acceptance criteria
- Appropriate story point sizing (1-8 points per story)
- Dependencies between split stories

Provide 3-6 smaller user stories with titles, descriptions, and acceptance criteria.

Return as JSON format matching the StoryAnalysisOutput interface with splitStories populated.`;

    case 'combine':
      return `${baseContext}

Related Stories:
${input.relatedStories?.map(s => `- ${s.title}: ${s.description || 'No description'}`).join('\n') || 'None provided'}

Analyze if these related stories should be combined into a single larger story or feature. Consider:
- Similar functionality or user goals
- Shared acceptance criteria
- Implementation dependencies
- Value delivery timing

Provide recommendations on whether to combine and how.

Return as JSON format matching the StoryAnalysisOutput interface with suggestions populated.`;

    case 'acceptance_criteria':
      return `${baseContext}

Generate comprehensive acceptance criteria for this ${input.storyType}. Include:
- Happy path scenarios
- Edge cases and error conditions
- Performance requirements
- Security considerations
- Accessibility requirements
- Cross-browser/device compatibility

Use Given-When-Then format where appropriate.

Return as JSON format matching the StoryAnalysisOutput interface with acceptanceCriteria populated.`;

    case 'refine':
      return `${baseContext}

Analyze this ${input.storyType} and provide refinement questions that a Product Owner should consider:
- User value and business justification
- Scope clarity and boundaries
- Dependencies and assumptions
- Risk assessment
- Definition of done
- Success metrics

Provide thoughtful questions that will improve story quality and team understanding.

Return as JSON format matching the StoryAnalysisOutput interface with refinementQuestions populated.`;

    default:
      return `${baseContext}

Provide general analysis and improvement suggestions for this ${input.storyType}.`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request received');
    
    const { canvasType, analysisType, type, ...inputData } = await req.json();
    console.log('Canvas type:', canvasType || type, 'Analysis type:', analysisType);
    
    let systemPrompt = '';
    let userPrompt = '';
    
    // Handle story analysis requests
    if (canvasType === 'story-analysis') {
      systemPrompt = 'You are an expert agile coach and product owner specializing in user story analysis and refinement. Provide actionable insights to improve story quality and team understanding.';
      userPrompt = generateStoryAnalysisPrompt({
        ...inputData,
        analysisType
      } as StoryAnalysisInput);
    } else if (canvasType === 'business-model-canvas' || type === 'bmc') {
      systemPrompt = 'You are an expert business analyst specializing in Business Model Canvas creation. Generate comprehensive, actionable business model components based on the provided information.';
      userPrompt = generateBMCPrompt(inputData as CanvasInput);
    } else if (canvasType === 'user-story-map' || type === 'user-story-map') {
      systemPrompt = 'You are an expert product manager and agile coach specializing in User Story Mapping. Create detailed, user-focused story maps.';
      userPrompt = generateUserStoryMapPrompt(inputData as CanvasInput);
    } else if (canvasType === 'customer-journey-map' || type === 'customer-journey') {
      systemPrompt = 'You are an expert UX researcher and customer experience specialist. Create detailed customer journey maps with insights and opportunities.';
      userPrompt = generateCustomerJourneyPrompt(inputData as CanvasInput);
    } else {
      throw new Error(`Unsupported canvas type: ${canvasType || type}`);
    }

    console.log('Generating canvas with OpenAI...', { canvasType: canvasType || type, inputData });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('OpenAI response received');
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', responseData);
      throw new Error('Invalid response from OpenAI API');
    }

    // Parse the response and clean up content
    const generatedContent = responseData.choices[0].message.content;
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw response:', generatedContent);
      throw new Error('Invalid JSON response from OpenAI API');
    }
    
    // Apply cleanup and validation based on canvas type
    if (canvasType === 'business-model-canvas' || type === 'bmc') {
      const cleanedContent: BMCOutput = {} as BMCOutput;
      
      for (const [key, value] of Object.entries(parsedContent)) {
        if (Array.isArray(value)) {
          cleanedContent[key as keyof BMCOutput] = value.map(item => cleanupText(item));
        } else if (typeof value === 'string') {
          cleanedContent[key as keyof BMCOutput] = [cleanupText(value)];
        }
      }
      
      // Validate spacing for all BMC content
      let hasSpacingIssues = false;
      for (const items of Object.values(cleanedContent)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            if (typeof item === 'string' && !validateSpacing(item)) {
              hasSpacingIssues = true;
              break;
            }
          }
        }
      }
      
      if (hasSpacingIssues) {
        console.warn('Spacing issues detected in BMC content');
      }
      
      parsedContent = cleanedContent;
    } else if (canvasType === 'story-analysis') {
      // Clean up story analysis content with safe array checks
      if (parsedContent.suggestions && Array.isArray(parsedContent.suggestions)) {
        parsedContent.suggestions = parsedContent.suggestions.map((s: string) => cleanupText(s));
      }
      if (parsedContent.acceptanceCriteria && Array.isArray(parsedContent.acceptanceCriteria)) {
        parsedContent.acceptanceCriteria = parsedContent.acceptanceCriteria.map((s: string) => cleanupText(s));
      }
      if (parsedContent.refinementQuestions && Array.isArray(parsedContent.refinementQuestions)) {
        parsedContent.refinementQuestions = parsedContent.refinementQuestions.map((s: string) => cleanupText(s));
      }
      if (parsedContent.splitStories && Array.isArray(parsedContent.splitStories)) {
        parsedContent.splitStories = parsedContent.splitStories.map((story: any) => ({
          ...story,
          title: cleanupText(story.title),
          description: cleanupText(story.description),
          acceptanceCriteria: Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria.map((s: string) => cleanupText(s)) : []
        }));
      }
      if (parsedContent.spidrAnalysis && typeof parsedContent.spidrAnalysis === 'object') {
        for (const [key, value] of Object.entries(parsedContent.spidrAnalysis)) {
          if (Array.isArray(value)) {
            parsedContent.spidrAnalysis[key] = value.map((s: string) => cleanupText(s));
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generatedCanvas: parsedContent,
      canvasType: canvasType || type
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