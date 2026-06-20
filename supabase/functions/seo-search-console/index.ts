// Admin-only proxy for the Google Search Console API.
// Mints an access token from a stored refresh token (GSC_* secrets) and exposes:
//   action 'report' -> sitemap status, URL index status, top queries/pages
//   action 'submit' -> (re)submit the sitemap
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE = 'sc-domain:altogetheragile.com';
const SITEMAP = 'https://altogetheragile.com/sitemap.xml';
const ENC_SITE = encodeURIComponent(SITE);
const ENC_SITEMAP = encodeURIComponent(SITEMAP);
const WM = `https://www.googleapis.com/webmasters/v3/sites/${ENC_SITE}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    client_id: Deno.env.get('GSC_CLIENT_ID') ?? '',
    client_secret: Deno.env.get('GSC_CLIENT_SECRET') ?? '',
    refresh_token: Deno.env.get('GSC_REFRESH_TOKEN') ?? '',
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // ── Admin gate (platform already verified the JWT; confirm the role) ──
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin');
    if (adminErr || !isAdmin) return json({ error: 'Forbidden' }, 403);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action: string = body.action ?? 'report';
    const token = await getAccessToken();
    const authd = { Authorization: `Bearer ${token}` };

    if (action === 'submit') {
      const put = await fetch(`${WM}/sitemaps/${ENC_SITEMAP}`, { method: 'PUT', headers: authd });
      if (!put.ok && put.status !== 204) return json({ error: `Submit failed ${put.status}: ${await put.text()}` }, 500);
      const smRes = await fetch(`${WM}/sitemaps/${ENC_SITEMAP}`, { headers: authd });
      return json({ ok: true, sitemap: smRes.ok ? await smRes.json() : null });
    }

    // ── report ──
    const urls: string[] = Array.isArray(body.urls) ? body.urls.slice(0, 25) : [];
    const saBody = (dimension: string) => JSON.stringify({
      startDate: daysAgo(28), endDate: daysAgo(1), dimensions: [dimension], rowLimit: 10, type: 'web',
    });

    const [sitemapRes, queriesRes, pagesRes, ...inspections] = await Promise.all([
      fetch(`${WM}/sitemaps/${ENC_SITEMAP}`, { headers: authd }),
      fetch(`${WM}/searchAnalytics/query`, { method: 'POST', headers: { ...authd, 'Content-Type': 'application/json' }, body: saBody('query') }),
      fetch(`${WM}/searchAnalytics/query`, { method: 'POST', headers: { ...authd, 'Content-Type': 'application/json' }, body: saBody('page') }),
      ...urls.map((u) => fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST', headers: { ...authd, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl: u, siteUrl: SITE }),
      })),
    ]);

    const sitemap = sitemapRes.ok ? await sitemapRes.json() : null;
    const queries = queriesRes.ok ? ((await queriesRes.json()).rows ?? []) : [];
    const pages = pagesRes.ok ? ((await pagesRes.json()).rows ?? []) : [];
    const index = await Promise.all(inspections.map(async (r, i) => {
      if (!r.ok) return { url: urls[i], verdict: 'ERROR', coverage: '', lastCrawl: null };
      const j = await r.json();
      const ir = j.inspectionResult?.indexStatusResult ?? {};
      return { url: urls[i], verdict: ir.verdict ?? 'UNKNOWN', coverage: ir.coverageState ?? '', lastCrawl: ir.lastCrawlTime ?? null };
    }));

    return json({ sitemap, index, queries, pages });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
