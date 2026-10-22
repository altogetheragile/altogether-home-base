'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VISITOR_VIEW_COOKIE } from '@/lib/auth';

// ============= Signing out from the site =============
//
// The session is in cookies both apps share (PR #728), so the server can end it. This device
// only: the App's own Sign out ends every session everywhere, which is right for "I think somebody
// has my password" and wrong for signing out of a laptop someone else was using.

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Unreachable auth must not keep somebody signed in. The cookies go below either way.
  }
  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    // The session, in however many chunks it was written. Not a reset still waiting for its email
    // to be opened: that verifier is not a session (see src/utils/authCleanup.ts).
    if (name.startsWith('sb-') && name.includes('auth-token') && !name.includes('code-verifier')) jar.delete(name);
  }
  // The App's "somebody is signed in" signal, and a view only an admin has.
  jar.delete('aa-auth');
  jar.delete(VISITOR_VIEW_COOKIE);
  redirect('/');
}
