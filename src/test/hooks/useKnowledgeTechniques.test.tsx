import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useKnowledgeTechniques } from '@/hooks/useKnowledgeTechniques';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [
                  {
                    id: '1',
                    name: 'Test Technique',
                    slug: 'test-technique',
                    summary: 'Test summary',
                    difficulty_level: 'Beginner',
                    estimated_reading_time: 5,
                    is_featured: true,
                    knowledge_categories: { name: 'Test Category', color: '#3B82F6' },
                    knowledge_technique_tags: [
                      { knowledge_tags: { name: 'testing', slug: 'testing' } }
                    ]
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useKnowledgeTechniques', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches techniques successfully', async () => {
    const { result } = renderHook(() => useKnowledgeTechniques(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Test Technique');
    expect(result.current.data?.[0].category?.name).toBe('Test Category');
    expect(result.current.data?.[0].tags).toHaveLength(1);
    expect(result.current.data?.[0].tags?.[0].name).toBe('testing');
  });

  it('handles search parameter', async () => {
    const { result } = renderHook(() => useKnowledgeTechniques({ search: 'test' }), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalledWith('knowledge_techniques');
  });

  it('handles category filter', async () => {
    const { result } = renderHook(() => useKnowledgeTechniques({ categoryId: 'cat-1' }), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  it('handles featured filter', async () => {
    const { result } = renderHook(() => useKnowledgeTechniques({ featured: true }), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});