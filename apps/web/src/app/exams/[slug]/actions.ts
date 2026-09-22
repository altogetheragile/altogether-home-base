'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/auth';

// ============= Saving a guide from the page it appears on =============
//
// This is the first write the Site has ever made as the person making it. Three things stand
// between a visitor and an exam guide, and the order matters:
//
//   1. the page only renders the editor for an admin;
//   2. this action checks again, because a Server Action is a public endpoint and the check in (1)
//      happened in a different request;
//   3. the update runs on the user's own session, so the "Admins can update exams" policy on the
//      table decides. If (1) and (2) were both wrong, RLS would still refuse.
//
// Only (3) is load-bearing. (1) is courtesy and (2) is defence in depth.

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveGuide(examId: string, guide: string): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not allowed.' };

  const trimmed = guide.trim();
  // Guides run to a thousand words; this is a sanity bound, not a style rule.
  if (trimmed.length > 60_000) return { ok: false, error: 'That is longer than a guide should be.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('exams')
    .update({ guide: trimmed === '' ? null : trimmed })
    .eq('id', examId);

  if (error) return { ok: false, error: error.message };

  // The page is dynamic, so this is belt and braces: it also clears the fetch cache for anything
  // that read this exam.
  revalidatePath('/exams', 'layout');
  return { ok: true };
}
