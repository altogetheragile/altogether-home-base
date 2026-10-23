import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { navigationRegistry } from '@altogether/ui/editor/registries';
import type { DataClient } from '@altogether/ui/editor/store';

// ============= The menu's words, as the site has written them =============
//
// The Site's menu reads these and this app's did not: it said Coaching, Sign In and Dashboard on
// every site whatever the site had called them. So /auth on a site that sells Services, and calls
// the button My Dashboard, showed a different menu from the page you had just left.
//
// Same rule as the Site: what was saved, over what shipped. Before the read lands, what shipped,
// which is what this menu always said, so nothing flashes on a site that has changed nothing.

/** A reader for the navigation registry: `t('nav.coaching')`. */
export function useNavigationWords(): (key: string) => string {
  const { data } = useQuery({
    queryKey: ['site-copy', 'navigation'],
    queryFn: async () => {
      // The generated types predate site_copy, as in NotReadyYet.
      const db = supabase as unknown as DataClient;
      const { data } = await db.from('site_copy').select('key, value').eq('page', 'navigation');
      const rows = (data ?? []) as { key: string; value: string }[];
      return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ''])) as Record<string, string>;
    },
    staleTime: 5 * 60 * 1000,
  });
  return (key: string) => data?.[key]?.trim() || navigationRegistry.entries[key]?.value || '';
}
