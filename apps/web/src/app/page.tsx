import { createClient } from '@/lib/supabase/server';
import { JsonLd, organizationJsonLd } from '@/lib/seo';

// Server-rendered per request so the proof reads live Supabase data without a
// build-time DB dependency. Real pages will mostly use static + revalidate (ISR).
export const dynamic = 'force-dynamic';

export default async function Home() {
  let exams: { slug: string; title: string }[] = [];
  let dataPath = 'no Supabase env set yet';
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('exams')
      .select('slug, title')
      .eq('status', 'published')
      .limit(10);
    if (!error) {
      exams = data ?? [];
      dataPath = 'server-rendered from Supabase (RLS-scoped anon)';
    } else {
      dataPath = `Supabase error: ${error.message}`;
    }
  } catch (e) {
    dataPath = `not connected: ${(e as Error).message}`;
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <JsonLd data={organizationJsonLd()} />
      <p style={{ display: 'inline-block', background: 'hsl(var(--primary))', color: '#fff', fontWeight: 600, fontSize: 13, padding: '4px 10px', borderRadius: 6 }}>
        Next.js skeleton - Phase 0
      </p>
      <h1 style={{ fontSize: 40, lineHeight: 1.2, margin: '16px 0', color: 'hsl(var(--foreground))' }}>
        Altogether Agile, server-rendered
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: 'hsl(var(--muted-foreground))' }}>
        This is the strangler-fig target app. It is not the live site yet. The list
        below proves the server-side Supabase data path.
      </p>
      <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 8 }}>
        Data path: <strong>{dataPath}</strong>
      </p>

      <h2 style={{ fontSize: 22, marginTop: 32, color: 'hsl(var(--foreground))' }}>
        Published exams ({exams.length})
      </h2>
      <ul>
        {exams.map((e) => (
          <li key={e.slug} style={{ margin: '6px 0' }}>
            {e.title}
          </li>
        ))}
        {exams.length === 0 && (
          <li style={{ color: 'hsl(var(--muted-foreground))' }}>
            None yet (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).
          </li>
        )}
      </ul>
    </main>
  );
}
