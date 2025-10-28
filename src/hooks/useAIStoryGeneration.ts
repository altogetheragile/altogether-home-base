import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type {
  GenerateStoryRequest,
  GenerateStoryResponse,
  StoryLevel,
  ParentContext,
  AdditionalFields,
  AIGenerationError
} from '@/types/ai-generation';

interface AnonymousUsage {
  count: number;
  resetAt: number;
}

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
 * Anonymous users get 3 free generations per 24 hours
 */
export function useAIStoryGeneration() {
  const { toast } = useToast();
  const [anonymousUsage, setAnonymousUsage] = useState<AnonymousUsage>({ count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 });

  // Load anonymous usage from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ai_generation_anonymous_count');
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if expired
      if (Date.now() > data.resetAt) {
        const newUsage = { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
        localStorage.setItem('ai_generation_anonymous_count', JSON.stringify(newUsage));
        setAnonymousUsage(newUsage);
      } else {
        setAnonymousUsage(data);
      }
    }
  }, []);

  const getAnonymousUsage = (): AnonymousUsage => {
    const stored = localStorage.getItem('ai_generation_anonymous_count');
    if (!stored) {
      const newUsage = { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
      return newUsage;
    }
    const data = JSON.parse(stored);
    // Reset if expired
    if (Date.now() > data.resetAt) {
      const newUsage = { count: 0, resetAt: Date.now() + 24 * 60 * 60 * 1000 };
      localStorage.setItem('ai_generation_anonymous_count', JSON.stringify(newUsage));
      return newUsage;
    }
    return data;
  };

  const incrementAnonymousUsage = () => {
    const usage = getAnonymousUsage();
    usage.count++;
    localStorage.setItem('ai_generation_anonymous_count', JSON.stringify(usage));
    setAnonymousUsage(usage);
    return usage;
  };

  const generateStory = useMutation<
    GenerateStoryResponse,
    Error,
    GenerateStoryOptions
  >({
    mutationFn: async (options) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check anonymous rate limit BEFORE calling API
      if (!user) {
        const usage = getAnonymousUsage();
        if (usage.count >= 3) {
          throw new Error('ANONYMOUS_LIMIT_REACHED');
        }
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
        // Handle anonymous limit specifically
        if (error.message?.includes('ANONYMOUS_LIMIT_REACHED')) {
          throw new Error('ANONYMOUS_LIMIT_REACHED');
        }
        
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

      // Track anonymous usage after successful generation
      if (!user && data.success) {
        incrementAnonymousUsage();
      }

      return data;
    },
    onSuccess: async (data, variables) => {
      const levelLabel = variables.storyLevel.charAt(0).toUpperCase() + 
                        variables.storyLevel.slice(1);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const usage = getAnonymousUsage();
        const remaining = 3 - usage.count;
        toast({
          title: `${levelLabel} Generated (${remaining} free ${remaining === 1 ? 'generation' : 'generations'} remaining)`,
          description: remaining > 0 
            ? `Sign in for unlimited AI generations!`
            : `This was your last free generation. Sign in to continue.`,
        });
      } else {
        toast({
          title: `${levelLabel} Generated`,
          description: `Successfully generated ${variables.storyLevel} using AI.`,
        });
      }
    },
    onError: (error) => {
      let description = error.message;
      let title = 'Generation Failed';

      // Customize error messages based on type
      if (error.message === 'ANONYMOUS_LIMIT_REACHED') {
        title = 'Free Generations Used';
        description = "You've used all 3 free AI generations. Sign in for unlimited access!";
      } else if (error.message.includes('rate limit')) {
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
    anonymousUsage, // Expose for UI display
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
