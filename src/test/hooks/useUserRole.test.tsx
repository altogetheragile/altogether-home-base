
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '../test-utils'
import { useUserRole } from '@/hooks/useUserRole'
import React from 'react'

// We reset mocks and modules before each test suite to not leak mocks between tests
let mockedAuth: any = null;
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockedAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('useUserRole', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    mockedAuth = { user: { id: 'user-1', email: 'tester@example.com' } };
  });

  afterEach(() => {
    // Clean up any window.fetch mocks after each test
    (window.fetch as any) = undefined;
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('returns null if no user', async () => {
    mockedAuth = { user: null };
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });
    expect(result.current.data).toBeNull();
  });

  it('returns role from Supabase on success', async () => {
    // MSW handlers are used, see handlers.ts
    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });
    await waitFor(() => expect(['admin', 'user']).toContain(result.current.data));
  });

  it('returns "user" if data.role not found', async () => {
    // Mock fetch to simulate missing role in the response
    window.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: 'user-1' }])
    } as any);

    const { result } = renderHook(() => useUserRole(), {
      wrapper: ({ children }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    });
    await waitFor(() => expect(result.current.data).toBe('user'));
    (window.fetch as any) = undefined;
  });

  it('returns null and logs error if there is error', async () => {
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
