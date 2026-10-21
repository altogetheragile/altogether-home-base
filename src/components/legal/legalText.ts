import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DataClient } from '@altogether/ui/editor/store';

// What a site has written for its own legal pages, read from This Site. See OwnLegal.tsx.

export type LegalPage = 'privacy' | 'terms' | 'cookies';

const KEYS: Record<LegalPage, string> = {
  privacy: 'site.legal.privacy',
  terms: 'site.legal.terms',
  cookies: 'site.legal.cookies',
};

/** What this site has written for its legal pages, all three in one read. */
export function useOwnLegal() {
  return useQuery({
    queryKey: ['site-copy', 'site', 'legal'],
    queryFn: async () => {
      // The generated types predate site_copy, as in NotReadyYet.
      const db = supabase as unknown as DataClient;
      const { data } = await db.from('site_copy').select('key, value').eq('page', 'site')
        .in('key', Object.values(KEYS));
      const rows = (data ?? []) as { key: string; value: string }[];
      const by = Object.fromEntries(rows.map((r) => [r.key, r.value?.trim() ?? '']));
      return Object.fromEntries(
        (Object.keys(KEYS) as LegalPage[]).map((page) => [page, by[KEYS[page]] ?? '']),
      ) as Record<LegalPage, string>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
