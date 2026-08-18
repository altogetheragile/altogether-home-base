import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// `zoo_copy` is applied by hand in the Supabase dashboard (the migration history is out of sync
// with remote), so it is not in the generated types yet. Cast in this one place, and drop the cast
// when the types are next regenerated.
const db = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => Promise<{ data: CopyRow[] | null; error: { message: string } | null }>;
    delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
    upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
  };
};
import { applyCopyOverrides } from './copy';

// Saved wording, laid over what the game shipped with.
//
// Loaded once before the game renders, so there is no flash of default text and no re-render
// machinery: the content structures are simply correct by the time anything reads them. If the
// query fails - offline, table missing, RLS - the game runs on its defaults and says nothing. A
// learner should never be blocked from playing because a sentence could not be fetched.

export interface CopyRow { key: string; value: string }

/** Load the saved copy and apply it. `ready` is true once the game is safe to render. */
export function useZooCopy() {
  const [ready, setReady] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      let map: Record<string, string> = {};
      try {
        const { data, error } = await db.from('zoo_copy').select('key,value');
        if (!error && data) map = Object.fromEntries(data.map((r) => [r.key, r.value]));
      } catch {
        // Defaults it is.
      }
      if (!live) return;
      applyCopyOverrides(map);
      setOverrides(map);
      setReady(true);
    })();
    return () => { live = false; };
  }, [reloads]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);

  return { ready, overrides, reload };
}

/** Save one piece of wording. An empty value removes the override, so "reset to the shipped
 *  wording" is the same action as clearing the box. */
export async function saveCopy(key: string, value: string, userId?: string): Promise<string | null> {
  if (!value.trim()) {
    const { error } = await db.from('zoo_copy').delete().eq('key', key);
    return error?.message ?? null;
  }
  const { error } = await db.from('zoo_copy').upsert(
    { key, value: value.trim(), updated_by: userId ?? null, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );
  return error?.message ?? null;
}
