import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { useUserRegistrations } from '@/hooks/useUserRegistrations';

import { createMockSupabaseResponse, mockAuthUser, createMockBasicRegistration, createMockEventDetails } from '@/test/utils/testHelpers';

// Mock Supabase  
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  }
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    session: { access_token: 'mock-token' },
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

describe('useUserRegistrations', () => {
  const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
  
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('returns empty array when user is not authenticated', async () => {
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      session: null,
    });

    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual([]);
  });

  it('fetches user registrations and enriches with event details', async () => {
    const mockRegistrations = [
      createMockBasicRegistration({ id: 'reg-1', event_id: 'event-1' }),
      createMockBasicRegistration({ id: 'reg-2', event_id: 'event-2' }),
    ];
    const mockEvents = [
      createMockEventDetails({ id: 'event-1', title: 'First Event', price_cents: 2500 }),
      createMockEventDetails({ id: 'event-2', title: 'Second Event', price_cents: 5000 }),
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
      if (table === 'events') {
        return {
          ...mockSupabase,
          select: () => ({
            ...mockSupabase,
            in: () => createMockSupabaseResponse(mockEvents),
          }),
        };
      }
      return mockSupabase;
    });

    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      id: 'reg-1',
      event: { id: 'event-1', title: 'First Event', price_cents: 2500 },
    });
    expect(result.current.data?.[1]).toMatchObject({
      id: 'reg-2',
      event: { id: 'event-2', title: 'Second Event', price_cents: 5000 },
    });
  });

  it('handles registrations with missing events', async () => {
    const mockRegistrations = [
      createMockBasicRegistration({ id: 'reg-1', event_id: 'event-1' }),
      createMockBasicRegistration({ id: 'reg-2', event_id: 'event-missing' }),
    ];
    const mockEvents = [
      createMockEventDetails({ id: 'event-1', title: 'First Event' }),
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
      if (table === 'events') {
        return {
          ...mockSupabase,
          select: () => ({
            ...mockSupabase,
            in: () => createMockSupabaseResponse(mockEvents),
          }),
        };
      }
      return mockSupabase;
    });

    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].event).toMatchObject({ id: 'event-1', title: 'First Event' });
    expect(result.current.data?.[1].event).toBeNull();
  });

  it('handles empty registration list', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'event_registrations') {
        return {
          ...mockSupabase,
          select: () => ({
            ...mockSupabase,
            eq: () => ({
              ...mockSupabase,
              order: () => createMockSupabaseResponse([]),
            }),
          }),
        };
      }
      return mockSupabase;
    });

    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
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

    const { result } = renderHook(() => useUserRegistrations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toMatchObject({ message: 'Database error' });
  });
});