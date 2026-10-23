import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Changing a role never leaves somebody with none.
//
// Reported from a second site: an admin used Edit Role -> Admin on their own row, saw "new row
// violates row-level security policy", and kept the admin badge. What they lost was the admin row in
// user_roles. The roles were deleted first, so the insert after it was checked against somebody who
// was, by then, not an admin, and refused. The page still said admin (it reads the profile) while
// the database had stopped treating them as one: the Users list shrank to their own row.
//
// So the order is the rule: the new role is written, then the others are removed, and the removal
// never touches the role just written.

const calls: string[] = [];
let deleteFilters: Array<[string, string, string]> = [];

vi.mock('@/integrations/supabase/client', () => {
  const table = (name: string) => ({
    update: () => ({ eq: async () => { calls.push(`${name}.update`); return { error: null }; } }),
    upsert: async () => { calls.push(`${name}.upsert`); return { error: null }; },
    insert: async () => { calls.push(`${name}.insert`); return { error: null }; },
    delete: () => {
      calls.push(`${name}.delete`);
      const chain = {
        eq: (col: string, v: string) => { deleteFilters.push(['eq', col, v]); return chain; },
        neq: (col: string, v: string) => { deleteFilters.push(['neq', col, v]); return chain; },
        then: (ok: (r: { error: null }) => void) => ok({ error: null }),
      };
      return chain;
    },
  });
  return { supabase: { from: table } };
});
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));
vi.mock('@/utils/auditLogger', () => ({ auditLogger: { update: async () => {} } }));
vi.mock('sonner', () => ({ toast: { success: () => {}, error: () => {} } }));

import { useUpdateUserRole } from './useUserRoleManagement';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('changing a role', () => {
  beforeEach(() => { calls.length = 0; deleteFilters = []; });

  it('writes the new role before removing any', async () => {
    const { result } = renderHook(() => useUpdateUserRole(), { wrapper });
    result.current.mutate({ userId: 'me', newRole: 'admin' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const added = calls.findIndex((c) => c === 'user_roles.upsert' || c === 'user_roles.insert');
    const removed = calls.indexOf('user_roles.delete');
    expect(added, 'the new role is never written').toBeGreaterThanOrEqual(0);
    expect(added, 'the roles are removed before the new one is written').toBeLessThan(removed);
  });

  it('does not remove the role it has just written', async () => {
    const { result } = renderHook(() => useUpdateUserRole(), { wrapper });
    result.current.mutate({ userId: 'someone', newRole: 'moderator' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteFilters).toContainEqual(['eq', 'user_id', 'someone']);
    expect(deleteFilters, 'the delete takes the new role with it').toContainEqual(['neq', 'role', 'moderator']);
  });
});
