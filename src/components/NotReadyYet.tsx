import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { logoOf, wordmarkOf } from '@altogether/ui/brand';
import { HoldingPage, type HoldingLogo } from '@altogether/ui/HoldingPage';
import { siteRegistry } from '@altogether/ui/editor/registries';
import type { DataClient } from '@altogether/ui/editor/store';

// ============= The whole site waits, not half of it =============
//
// The Site learned to show a holding page while a site is being built. This app did not, so it
// carried on serving its tools and games to anybody who knew a URL while the front door said the
// site was not ready. A holding page covering one of two apps is not a holding page.
//
// Two ways in stay open, whatever the switch says. Signing in, because an administrator who
// cannot sign in cannot turn it off, and the reset form the same link may land on.

const ALWAYS_OPEN = ['/auth'];

const HEADING = 'site.construction.heading';
const BODY = 'site.construction.body';

/** The same two sentences the Site shows, read the same way: what was saved, over what shipped.
 *
 *  Not hardcoded here. Two holding pages saying different things is the duplication this whole
 *  change exists to avoid, and somebody who writes their own words should see them on whichever
 *  app a visitor happens to land on. */
function useConstructionWords() {
  const { data } = useQuery({
    queryKey: ['site-copy', 'site', 'construction'],
    queryFn: async () => {
      // The generated types for this app predate site_copy, which is why the editor passes this
      // same client to the shared store as a DataClient rather than by its own type.
      const db = supabase as unknown as DataClient;
      const { data } = await db.from('site_copy').select('key, value').eq('page', 'site')
        .in('key', [HEADING, BODY]);
      const rows = (data ?? []) as { key: string; value: string }[];
      return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
    },
    staleTime: 5 * 60 * 1000,
  });
  const shipped = (key: string) => siteRegistry.entries[key]?.value ?? '';
  return {
    heading: data?.[HEADING]?.trim() || shipped(HEADING),
    body: data?.[BODY]?.trim() || shipped(BODY),
  };
}

export function NotReadyYet({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { settings, isLoading } = useSiteSettings();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const words = useConstructionWords();

  const s = settings as { under_construction?: boolean | null; brand?: unknown; company_name?: string | null; contact_email?: string | null } | undefined;

  // Nothing is decided until both answers are in. Rendering the app first and correcting it a
  // moment later would show a visitor exactly what the switch is meant to hide, and rendering the
  // holding page first would flash it on every site that is not hiding anything.
  if (isLoading || roleLoading) return null;
  if (!s?.under_construction) return <>{children}</>;
  if (role === 'admin') return <>{children}</>;
  if (ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return <>{children}</>;

  const logo = logoOf(s.brand as Parameters<typeof logoOf>[0], s.company_name);
  const mark = wordmarkOf(s.brand as Parameters<typeof wordmarkOf>[0], s.company_name);
  const shown: HoldingLogo = logo.mode === 'image'
    ? { mode: 'image', src: logo.src }
    : { mode: 'wordmark', text: mark.gap ? `${mark.first} ${mark.second}` : `${mark.first}${mark.second}` };

  return <HoldingPage logo={shown} heading={words.heading} body={words.body} email={s.contact_email} />;
}
