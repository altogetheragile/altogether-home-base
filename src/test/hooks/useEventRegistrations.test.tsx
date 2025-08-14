import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventRegistrations, useDeleteRegistration } from '@/hooks/useEventRegistrations';
import { createMockSupabaseResponse, createMockRegistration, createMockUser, mockAuthUser } from '@/test/utils/testHelpers';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useEventRegistrations', () => {
  const mockSupabase = require('@/integrations/supabase/client').supabase;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no event ID provided', async () => {
    const { result } = renderHook(() => useEventRegistrations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });

  it('fetches registrations and enriches with user profiles', async () => {
    const mockRegistrations = [
      createMockRegistration({ id: 'reg-1', user_id: 'user-1' }),
      createMockRegistration({ id: 'reg-2', user_id: 'user-2' }),
    ];
    const mockProfiles = [
      createMockUser({ id: 'user-1', full_name: 'John Doe', email: 'john@example.com' }),
      createMockUser({ id: 'user-2', full_name: 'Jane Smith', email: 'jane@example.com' }),
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'event_registrations') {
        return {
          ...mockSupabase,
          select: () => ({
            ...mockSupabase,
            eq: () => ({
              ...mockSupabase,
              order: () => createMockSupabaseResponse(mockRegistrations),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          ...mockSupabase,
          select: () => ({
            ...mockSupabase,
            in: () => createMockSupabaseResponse(mockProfiles),
          }),
        };
      }
      return mockSupabase;
    });

    const { result } = renderHook(() => useEventRegistrations('event-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      id: 'reg-1',
      user: { id: 'user-1', full_name: 'John Doe', email: 'john@example.com' },
    });
  });

  it('handles registrations with missing user profiles', async () => {
    const mockRegistrations = [
      createMockRegistration({ id: 'reg-1', user_id: 'user-1' }),
      createMockRegistration({ id: 'reg-2', user_id: null }),
    ];
    const mockProfiles = [
      createMockUser({ id: 'user-1', full_name: 'John Doe' }),
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'event_registrations') {
        return {
          ...mockSupabase,
          select: () => ({
            ...mockSupabase,
            eq: () => ({
              ...mockSupabase,
              order: () => createMockSupabaseResponse(mockRegistrations),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          ...mockSupabase,
          select: () => ({
            ...mockSupabase,
            in: () => createMockSupabaseResponse(mockProfiles),
          }),
        };
      }
      return mockSupabase;
    });

    const { result } = renderHook(() => useEventRegistrations('event-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].user).toMatchObject({ id: 'user-1', full_name: 'John Doe' });
    expect(result.current.data?.[1].user).toBeNull();
  });

  it('handles fetch errors gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      ...mockSupabase,
      select: () => ({
        ...mockSupabase,
        eq: () => ({
          ...mockSupabase,
          order: () => createMockSupabaseResponse(null, { message: 'Database error' }),
        }),
      }),
    });

    const { result } = renderHook(() => useEventRegistrations('event-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toMatchObject({ message: 'Database error' });
  });
});

describe('useDeleteRegistration', () => {
  const mockSupabase = require('@/integrations/supabase/client').supabase;
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    require('@/hooks/use-toast').useToast.mockReturnValue({ toast: mockToast });
  });

  it('successfully deletes a registration', async () => {
    mockSupabase.from.mockReturnValue({
      ...mockSupabase,
      delete: () => ({
        ...mockSupabase,
        eq: () => createMockSupabaseResponse(null),
      }),
    });

    const { result } = renderHook(() => useDeleteRegistration('event-123'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('reg-123');

    expect(mockSupabase.from).toHaveBeenCalledWith('event_registrations');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Registration deleted',
      description: 'The registration has been removed from this event.',
    });
  });

  it('handles deletion errors', async () => {
    mockSupabase.from.mockReturnValue({
      ...mockSupabase,
      delete: () => ({
        ...mockSupabase,
        eq: () => createMockSupabaseResponse(null, { message: 'Delete failed' }),
      }),
    });

    const { result } = renderHook(() => useDeleteRegistration('event-123'), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.mutateAsync('reg-123');
    } catch (error) {
      expect(error).toMatchObject({ message: 'Delete failed' });
    }

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Failed to delete registration',
      description: 'Delete failed',
      variant: 'destructive',
    });
  });
});