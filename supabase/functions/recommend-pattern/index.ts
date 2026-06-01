import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const SYSTEM_INSTRUCTION = `You are the ISA-O3 pattern adviser for Altogether Agile. You turn a product or
project scenario into a flow of artifacts and techniques, drawn ONLY from the
supplied catalogue.

ISA-O3 in brief: work happens across three Value Horizons - Organisation,
Coordination, Team. At each horizon three questions are asked: Intent (why, and
where are we heading), Scope (what, and for whom), Approach (how do we decide and
operate). Every artifact sits at one horizon, one ISA dimension, and one layer
(Anchoring, Iterative, Evidence). Techniques are methods that produce artifacts.

Your job:
1. Diagnose the scenario. Name the primary horizon and where Intent, Scope or
   Approach is unclear or at risk.
2. Recommend a sequenced flow of four to eight steps that closes those gaps. Each
   step names one artifact to produce and one or two techniques to produce it,
   with a one-sentence rationale tied to the scenario.
3. Order it sensibly: settle Intent before Scope before Approach, and let higher
   horizons set context for lower ones.

Rules:
- Use ONLY artifacts and techniques from the catalogue, referenced by their exact
  id. Never invent items or ids.
- Recommend diagnosis and good questions, not a fixed methodology.
- Return STRICT JSON matching the schema. No prose, no markdown, outside the JSON.`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ success: false, error: 'Pattern Builder is not configured yet.' }, 500);

    const { scenario } = await req.json().catch(() => ({ scenario: '' }));
    if (!scenario || typeof scenario !== 'string' || scenario.trim().length < 10) {
      return json({ success: false, error: 'Please describe your scenario in a sentence or two.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Optional auth: if a signed-in user is present, enforce a per-user rate limit.
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
      const { data } = await anon.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = data?.user?.id ?? null;
    }
    if (userId) {
      const { data: ok } = await supabase.rpc('check_ai_rate_limit', {
        p_user_id: userId,
        p_endpoint: 'recommend-pattern',
        p_max_requests: 30,
        p_window_minutes: 60,
      });
      if (ok === false) return json({ success: false, error: 'Rate limit reached. Please try again later.' }, 429);
    }

    // Build a terse catalogue from the live knowledge base.
    const { data: rows, error: kbErr } = await supabase
      .from('knowledge_items')
      .select('slug, name, item_type, description, horizon, isa, layer')
      .eq('is_published', true);
    if (kbErr) throw kbErr;

    const artifacts = (rows || []).filter((r) => r.item_type === 'artifact');
    const techniques = (rows || []).filter((r) => r.item_type === 'technique');
    const artifactIds = new Set(artifacts.map((a) => a.slug));
    const techniqueIds = new Set(techniques.map((t) => t.slug));

    const catalogue = {
      artifacts: artifacts.map((a) => ({
        id: a.slug, name: a.name, horizon: a.horizon, isa: a.isa, layer: a.layer,
        oneLiner: (a.description || '').slice(0, 160),
      })),
      techniques: techniques.map((t) => ({
        id: t.slug, name: t.name, oneLiner: (t.description || '').slice(0, 160),
      })),
    };

    const userMessage = `CATALOGUE:\n${JSON.stringify(catalogue)}\n\nSCENARIO:\n${scenario.trim()}\n\nReturn STRICT JSON: { "diagnosis": string, "primaryHorizon": "Organisation|Coordination|Team", "steps": [{ "order": number, "horizon": string, "isa": string, "artifactId": string, "techniqueIds": string[], "rationale": string }], "cautions": string[] }`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        temperature: 0.2,
        system: SYSTEM_INSTRUCTION,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!resp.ok) {
      console.error('Anthropic error:', resp.status, await resp.text());
      return json({ success: false, error: 'The adviser is unavailable right now. Please try again.' }, 502);
    }

    const completion = await resp.json();
    const text = completion?.content?.[0]?.text ?? '';
    let parsed: any;
    try {
      parsed = JSON.parse(stripFences(text));
    } catch {
      return json({ success: false, error: 'Could not read a recommendation. Please rephrase and try again.' }, 502);
    }

    // Validate every id against the catalogue; drop hallucinations.
    const steps = Array.isArray(parsed?.steps) ? parsed.steps : [];
    const validSteps = steps
      .filter((s: any) => s && artifactIds.has(s.artifactId))
      .map((s: any, i: number) => ({
        order: typeof s.order === 'number' ? s.order : i + 1,
        horizon: s.horizon ?? null,
        isa: s.isa ?? null,
        artifactId: s.artifactId,
        techniqueIds: (Array.isArray(s.techniqueIds) ? s.techniqueIds : []).filter((id: string) => techniqueIds.has(id)),
        rationale: typeof s.rationale === 'string' ? s.rationale : '',
      }))
      .sort((a: any, b: any) => a.order - b.order);

    if (validSteps.length === 0) {
      return json({
        success: true,
        data: {
          diagnosis: typeof parsed?.diagnosis === 'string' ? parsed.diagnosis : '',
          primaryHorizon: parsed?.primaryHorizon ?? null,
          steps: [],
          cautions: Array.isArray(parsed?.cautions) ? parsed.cautions : [],
          empty: true,
        },
      });
    }

    const result = {
      diagnosis: typeof parsed?.diagnosis === 'string' ? parsed.diagnosis : '',
      primaryHorizon: parsed?.primaryHorizon ?? null,
      steps: validSteps,
      cautions: (Array.isArray(parsed?.cautions) ? parsed.cautions : []).filter((c: unknown) => typeof c === 'string'),
    };

    // Best-effort audit; never block the response on it.
    try {
      await supabase.from('ai_generation_audit').insert({
        user_id: userId,
        input_data: { scenario: scenario.slice(0, 2000) },
        output_data: result,
        success: true,
        ip_address: req.headers.get('x-forwarded-for') || null,
        user_agent: req.headers.get('user-agent') || null,
      });
    } catch (_) { /* ignore audit failures */ }

    return json({ success: true, data: result });
  } catch (error) {
    console.error('recommend-pattern error:', error);
    return json({ success: false, error: (error as Error).message }, 500);
  }
});
