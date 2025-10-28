import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  GenerateStoryRequest,
  GenerateStoryResponse,
  StoryLevel,
  ParentContext,
  AdditionalFields,
  AIGenerationError
} from '@/types/ai-generation';

interface GenerateStoryOptions {
  storyLevel: StoryLevel;
  userInput: string;
  parentContext?: ParentContext;
  additionalFields?: AdditionalFields;
  parentId?: string;
}

/**
 * Custom hook for AI-powered story generation
 * Supports Epic → Feature → Story → Task hierarchy
 */
export function useAIStoryGeneration() {
  const { toast } = useToast();

  const generateStory = useMutation<
    GenerateStoryResponse,
    Error,
    GenerateStoryOptions
  >({
    mutationFn: async (options) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to generate stories');
      }

      const request: GenerateStoryRequest = {
        storyLevel: options.storyLevel,
        userInput: options.userInput,
        parentContext: options.parentContext,
        additionalFields: options.additionalFields,
        parentId: options.parentId,
      };

      const { data, error } = await supabase.functions.invoke<GenerateStoryResponse>(
        'generate-user-story',
        {
          body: request,
        }
      );

      if (error) {
        // Handle rate limit errors specifically
        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          const rateLimitError: AIGenerationError = {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'You have exceeded the rate limit. Please try again later.',
          };
          throw new Error(rateLimitError.message);
        }

        // Handle other errors
        throw new Error(error.message || 'Failed to generate story');
      }

      if (!data) {
        throw new Error('No response from AI generation service');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI generation failed');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const levelLabel = variables.storyLevel.charAt(0).toUpperCase() + 
                        variables.storyLevel.slice(1);
      
      toast({
        title: `${levelLabel} Generated`,
        description: `Successfully generated ${variables.storyLevel} using AI.`,
      });
    },
    onError: (error) => {
      let description = error.message;
      let title = 'Generation Failed';

      // Customize error messages based on type
      if (error.message.includes('rate limit')) {
        title = 'Rate Limit Exceeded';
        description = 'You can make up to 50 requests per hour. Please try again later.';
      } else if (error.message.includes('Unauthorized')) {
        title = 'Authentication Required';
        description = 'Please log in to use AI story generation.';
      }

      toast({
        title,
        description,
        variant: 'destructive',
      });
    },
  });

  return {
    generateStory: generateStory.mutate,
    generateStoryAsync: generateStory.mutateAsync,
    isGenerating: generateStory.isPending,
    isSuccess: generateStory.isSuccess,
    isError: generateStory.isError,
    error: generateStory.error,
    data: generateStory.data,
    reset: generateStory.reset,
  };
}

/**
 * Hook to fetch AI generation audit logs for current user
 */
export function useAIGenerationAudit() {
  return {
    // This can be extended to fetch audit logs
    // For now, admins can view via Supabase dashboard
  };
}
