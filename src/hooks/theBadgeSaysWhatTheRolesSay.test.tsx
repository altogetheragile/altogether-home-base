import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Admin -> Users shows the role that decides.
//
// Reported from a second site: Edit Role -> Admin on somebody said it had worked and the list went
// on calling them a user. It had worked. The hook writes the profile and user_roles; RLS lets an
// admin write user_roles and only their own profile, and a refused update is not an error, it is
// zero rows. So user_roles said admin (which every permission check reads) and the profile, which
// the list showed, said user.

const PROFILES = [
  { id: 'fiona', full_name: 'Fiona', email: 'f@x', username: null, role: 'user', created_at: '', profile_image_url: null },
  { id: 'al', full_name: 'Al', email: 'a@x', username: null, role: 'admin', created_at: '', profile_image_url: null },
  { id: 'new', full_name: 'New', email: 'n@x', username: null, role: 'user', created_at: '', profile_image_url: null },
];
const ROLES = [
  { user_id: 'fiona', role: 'admin' },
  { user_id: 'al', role: 'admin' },
  { user_id: 'al', role: 'user' },
  { user_id: 'new', role: 'user' },
];

vi.mock('@/integrations/supabase/client', () => {
  const query = (rows: Array<Record<string, unknown>>) => {
    let out = [...rows];
    const chain = {
      select: () => chain,
      order: () => chain,
      or: () => chain,
      range: () => chain,
      eq: (c: string, v: unknown) => { out = out.filter((r) => r[c] === v); return chain; },
      in: (c: string, vs: unknown[]) => { out = out.filter((r) => vs.includes(r[c])); return chain; },
      then: (ok: (r: { data: unknown; error: null; count: number }) => void) => ok({ data: out, error: null, count: out.length }),
    };
    return chain;
  };
  return { supabase: { from: (t: string) => query(t === 'profiles' ? PROFILES : ROLES) } };
});
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'al' } }) }));
vi.mock('./useUserRole', () => ({ useUserRole: () => ({ data: 'admin' }) }));

import { useUsers } from './useUsers';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const listed = async (role?: string) => {
  const { result } = renderHook(() => useUsers({ role }), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  return result.current.data!.users;
};

describe('the role on Admin -> Users', () => {
  it('is the one user_roles holds, not the profile', async () => {
    const fiona = (await listed()).find((u) => u.id === 'fiona');
    expect(fiona?.role, 'made an admin, still shown as a user').toBe('admin');
  });

  it('is the strongest one held', async () => {
    expect((await listed()).find((u) => u.id === 'al')?.role).toBe('admin');
  });

  it('is what the filter goes by', async () => {
    expect((await listed('admin')).map((u) => u.id).sort()).toEqual(['al', 'fiona']);
    expect((await listed('user')).map((u) => u.id), 'an admin is also listed as a user').toEqual(['new']);
  });
});
