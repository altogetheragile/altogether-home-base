'use server';

import { cookies } from 'next/headers';
import { isAdmin, VISITOR_VIEW_COOKIE } from '@/lib/auth';

// ============= Switching between admin view and the visitor's =============
//
// Checked, though the cookie can only take things away (see lib/auth.ts): a Server Action is a
// public endpoint, and there is no reason to set anything for somebody who has no admin view.

export async function setVisitorView(on: boolean): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  const jar = await cookies();
  // A year, so it lasts until switched back rather than until the browser closes. httpOnly,
  // because only the server decides what a page shows.
  if (on) jar.set(VISITOR_VIEW_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: true, secure: true });
  else jar.delete(VISITOR_VIEW_COOKIE);
  return { ok: true };
}
