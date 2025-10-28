import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAIStoryGeneration } from './useAIStoryGeneration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useAIStoryGeneration', () => {
  const mockSession = {
    access_token: 'mock-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
  });

  it('should generate a user story successfully', async () => {
    const mockResponse = {
      data: {
        story: {
          title: 'Test Story',
          description: 'Test Description',
          acceptance_criteria: ['Criterion 1', 'Criterion 2'],
          confidence_level: 4,
        },
      },
      error: null,
    };

    (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIStoryGeneration());

    const request = {
      level: 'story' as const,
      userInput: 'Create a login feature',
      userPersona: 'End User',
      businessObjective: 'Improve security',
    };

    const response = await result.current.generateStory(request);

    expect(response).toEqual(mockResponse.data);
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'generate-user-story',
      expect.objectContaining({
        body: request,
      })
    );
  });

  it('should handle rate limit errors', async () => {
    const mockError = {
      data: null,
      error: {
        message: 'Rate limit exceeded. Please try again in 30 minutes.',
      },
    };

    (supabase.functions.invoke as any).mockResolvedValue(mockError);

    const { result } = renderHook(() => useAIStoryGeneration());

    await expect(
      result.current.generateStory({
        level: 'story',
        userInput: 'Test input',
      })
    ).rejects.toThrow('Rate limit exceeded');

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Rate limit exceeded'),
      expect.any(Object)
    );
  });

  it('should handle authentication errors', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAIStoryGeneration());

    await expect(
      result.current.generateStory({
        level: 'story',
        userInput: 'Test input',
      })
    ).rejects.toThrow('Authentication required');
  });

  it('should track loading state correctly', async () => {
    const mockResponse = {
      data: { story: { title: 'Test' } },
      error: null,
    };

    (supabase.functions.invoke as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockResponse), 100);
        })
    );

    const { result } = renderHook(() => useAIStoryGeneration());

    expect(result.current.isGenerating).toBe(false);

    const promise = result.current.generateStory({
      level: 'story',
      userInput: 'Test input',
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(true);
    });

    await promise;

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('should handle different story levels', async () => {
    const mockResponse = {
      data: { epic: { title: 'Test Epic' } },
      error: null,
    };

    (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIStoryGeneration());

    await result.current.generateStory({
      level: 'epic',
      userInput: 'Create user management system',
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'generate-user-story',
      expect.objectContaining({
        body: expect.objectContaining({
          level: 'epic',
        }),
      })
    );
  });

  it('should include parent context when provided', async () => {
    const mockResponse = {
      data: { story: { title: 'Test' } },
      error: null,
    };

    (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAIStoryGeneration());

    const parentContext = {
      id: 'epic-123',
      level: 'epic' as const,
      title: 'User Management',
      description: 'System for managing users',
    };

    await result.current.generateStory({
      level: 'feature',
      userInput: 'User registration',
      parentContext,
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'generate-user-story',
      expect.objectContaining({
        body: expect.objectContaining({
          parentContext,
        }),
      })
    );
  });
});
