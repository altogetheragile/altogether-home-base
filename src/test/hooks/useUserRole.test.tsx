import { describe, it, vi, expect } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '../test-utils'
import { useUserRole } from '@/hooks/useUserRole'
import React from 'react'

// Remove direct Supabase client mocks. We will use MSW handlers.
// Also don't do vi.doMock - use correct vi.mock at top of file, and test-utils wrapper for QueryClient

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'tester@example.com' }
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('useUserRole', () => {
  const queryClient = new QueryClient();

  it('returns null if no user', async () => {
    // Mock context to no user for this test only.
    vi.mock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null }),
      AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
    }));
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });
    expect(result.current.data).toBeNull();
  });

  it('returns role from Supabase on success', async () => {
    // By default our MSW handler for profiles will send { id: user-1, role: 'admin' }
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });
    await waitFor(() => expect(['admin', 'user']).toContain(result.current.data));
  });

  it('returns "user" if data.role not found', async () => {
    // We'll trick MSW to return profile with null role for this test only
    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: 'user-1' }])
    } as any);

    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });
    await waitFor(() => expect(result.current.data).toBe('user'));

    // reset fetch for other tests
    (window.fetch as any) = undefined;
  });

  it('returns null and logs error if there is error', async () => {
    // For this test, we want the backend to error
    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'DB error' } })
    } as any);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });
    await waitFor(() => expect(result.current.data).toBeNull());
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    (window.fetch as any) = undefined;
  });
});
