// Health check for uptime monitoring. Verifies the app is serving AND that its critical
// dependency (Supabase / PostgREST) is reachable on the actual data path the site uses,
// not just "does the page load". Returns 200 when healthy, 503 when Supabase is degraded,
// so an uptime monitor can alert on the dependency, not only on a hard outage.
//
// Public, no secrets in the response, never cached. Reachable at /api/health.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TIMEOUT_MS = 3000;

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let supabase: 'ok' | 'degraded' | 'unconfigured' = 'unconfigured';

  if (url && anon) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      // Cheap read on a table the public site already depends on. Exercises PostgREST +
      // Postgres + RLS end-to-end, returning at most one id (no data of interest).
      const res = await fetch(`${url}/rest/v1/site_settings?select=id&limit=1`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        signal: controller.signal,
        cache: 'no-store',
      });
      supabase = res.ok ? 'ok' : 'degraded';
    } catch {
      supabase = 'degraded'; // timeout or network error
    } finally {
      clearTimeout(timer);
    }
  }

  const healthy = supabase === 'ok';
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks: { app: 'ok', supabase },
      durationMs: Date.now() - startedAt,
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    },
  );
}
