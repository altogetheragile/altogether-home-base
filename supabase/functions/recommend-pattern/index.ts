import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateSteps, sanitizeProse } from '../_shared/pattern-grounding.ts';

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

Read the variables, not the label. A scenario's surface words (start-up, SAFe,
project, enterprise, "just add it to the backlog") often point the wrong way.
Diagnose from the decisive variables underneath, never the label:
- endpoint: a real finish line, or open-ended work?
- demand: proven and paying, or assumed and unvalidated?
- predictability: foreseeable, or interrupt-driven?
- units: one team / one product / one backlog, or genuinely many?
- fixed constraint: which of time, cost or scope is immovable, and what flexes?
When the presenting framing and the decisive variable diverge, say so in the
diagnosis ("presented as X; the deciding factor is actually Y").

Rules:
- Use ONLY artifacts and techniques from the catalogue, referenced by their exact
  id. Never invent items or ids.
- In artifactId and techniqueIds, use ids. Everywhere else - diagnosis, rationale,
  cautions - write the artifact or technique NAME, never its id/slug. Ids must
  never appear in prose.
- Recommend diagnosis and good questions, not a fixed methodology.
- Return STRICT JSON matching the schema. No prose, no markdown, outside the JSON.`;

const OUTPUT_SCHEMA_HINT = `Return STRICT JSON: { "diagnosis": string, "primaryHorizon": "Organisation|Coordination|Team", "steps": [{ "order": number, "horizon": string, "isa": string, "artifactId": string, "techniqueIds": string[], "rationale": string }], "cautions": string[] }`;

// Triage runs before any recommendation, so the adviser consults before it
// prescribes and does not solve the presenting problem by reflex.
const TRIAGE_SYSTEM = `You are a consulting coach triaging a product or project scenario BEFORE any
recommendation is made. Your goal is to avoid prescribing for the presenting
problem when the real problem may be different.

Decide whether the scenario already reveals the DECISIVE variables, or whether you
would be guessing. The decisive variables are:
- endpoint: a real finish line, or open-ended work?
- demand: proven and paying, or assumed and unvalidated?
- predictability: foreseeable, or interrupt-driven?
- units: one team / one product / one backlog, or genuinely many?
- fixed constraint: which of time, cost or scope is immovable, and what flexes?

If one or more decisive variables are unknown AND would change the recommendation,
return 2 to 3 OPEN, non-leading questions that surface them - the questions a good
consultant asks to separate the presenting problem from the real one. Never ask
leading or multiple-choice questions, and never hint at the answer you expect.

Return STRICT JSON only, no prose or markdown outside it:
{ "decision": "clarify" | "ready", "questions": string[], "note": string }
Use "ready" only when the scenario already pins down the decisive variables. The
"note" is one short sentence on what is still unclear (clarify) or why it is ready.`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

// Parse JSON even if the model wrapped it in prose/fences: try strict first,
// then fall back to the outermost { ... } slice.
function parseJsonLoose(text: string): any {
  const t = stripFences(text);
  try {
    return JSON.parse(t);
  } catch {
    const first = t.indexOf('{');
    const last = t.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(t.slice(first, last + 1));
    throw new Error('no_json_object');
  }
}

// Single Anthropic Messages call returning parsed JSON (or throws).
async function callClaude(apiKey: string, system: string, userMessage: string, maxTokens = 4096): Promise<any> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.error('Anthropic error:', resp.status, body);
    throw new Error(`anthropic_${resp.status}`);
  }
  const completion = await resp.json();
  const text = completion?.content?.[0]?.text ?? '';
  return parseJsonLoose(text);
}

// Shape the model output into a validated result: ids in steps are checked
// against the catalogue (hallucinations dropped) and all prose is scrubbed of
// any id/slug so nothing ungrounded reaches the user.
function shapeResult(
  parsed: any,
  artifactIds: Set<string>,
  techniqueIds: Set<string>,
  idToName: Map<string, string>,
) {
  const steps = validateSteps(parsed?.steps, artifactIds, techniqueIds).map((s) => ({
    ...s,
    rationale: sanitizeProse(s.rationale, idToName),
  }));
  const cautions = (Array.isArray(parsed?.cautions) ? parsed.cautions : [])
    .filter((c: unknown) => typeof c === 'string')
    .map((c: string) => sanitizeProse(c, idToName))
    .filter((c: string) => c.length > 0);
  return {
    diagnosis: sanitizeProse(typeof parsed?.diagnosis === 'string' ? parsed.diagnosis : '', idToName),
    primaryHorizon: parsed?.primaryHorizon ?? null,
    steps,
    cautions,
  };
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

    const body = await req.json().catch(() => ({}));
    const scenario = body?.scenario;
    // answers: prior clarifying Q&A from the triage step. force: user chose to
    // skip questions ("just give me a pattern anyway").
    const force = body?.force === true;
    const qa: { question: string; answer: string }[] = Array.isArray(body?.answers)
      ? body.answers
          .filter((a: unknown): a is { question: string; answer: string } =>
            !!a && typeof (a as any).question === 'string' && typeof (a as any).answer === 'string')
          .map((a: { question: string; answer: string }) => ({ question: a.question, answer: a.answer.trim() }))
          .filter((a: { answer: string }) => a.answer.length > 0)
      : [];
    if (!scenario || typeof scenario !== 'string' || scenario.trim().length < 10) {
      return json({ success: false, error: 'Please describe your scenario in a sentence or two.' }, 400);
    }
    const scenarioStr = scenario.trim();
    const enrichedScenario = qa.length > 0
      ? `${scenarioStr}\n\nClarifying questions and the user's answers:\n${qa.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}`
      : scenarioStr;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Optional auth: per-user rate limit if signed in.
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

    // ── Triage gate: consult before prescribing ─────────────────────────────
    // On the first pass (no prior answers, not forced), check whether the
    // scenario reveals the decisive variables. If not, ask open questions and
    // stop here rather than prescribe for the presenting problem. One round only.
    if (!force && qa.length === 0) {
      try {
        const triage = await callClaude(
          apiKey,
          TRIAGE_SYSTEM,
          `SCENARIO:\n${scenarioStr}\n\nReturn the triage JSON.`,
          768,
        );
        if (triage?.decision === 'clarify') {
          const questions = (Array.isArray(triage.questions) ? triage.questions : [])
            .filter((q: unknown): q is string => typeof q === 'string' && q.trim().length > 0)
            .map((q: string) => q.trim())
            .slice(0, 3);
          if (questions.length > 0) {
            return json({
              success: true,
              data: { status: 'clarify', questions, note: typeof triage.note === 'string' ? triage.note : undefined },
            });
          }
        }
      } catch (_) {
        // If triage fails, fall through and prescribe rather than blocking the user.
      }
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
    const idToName = new Map<string, string>(
      [...artifacts, ...techniques].map((r) => [r.slug, r.name]),
    );

    const catalogue = {
      artifacts: artifacts.map((a) => ({
        id: a.slug, name: a.name, horizon: a.horizon, isa: a.isa, layer: a.layer,
        oneLiner: (a.description || '').slice(0, 160),
      })),
      techniques: techniques.map((t) => ({
        id: t.slug, name: t.name, oneLiner: (t.description || '').slice(0, 160),
      })),
    };
    const catalogueStr = JSON.stringify(catalogue);

    // ── 1. Generate draft pattern ───────────────────────────────────────────
    let parsed: any;
    try {
      parsed = await callClaude(
        apiKey,
        SYSTEM_INSTRUCTION,
        `CATALOGUE:\n${catalogueStr}\n\nSCENARIO:\n${enrichedScenario}\n\n${OUTPUT_SCHEMA_HINT}`,
      );
    } catch (e) {
      const msg = String((e as Error).message || '');
      if (msg.startsWith('anthropic_')) return json({ success: false, error: 'The adviser is unavailable right now. Please try again.' }, 502);
      return json({ success: false, error: 'Could not read a recommendation. Please rephrase and try again.' }, 502);
    }
    let result = shapeResult(parsed, artifactIds, techniqueIds, idToName);

    // ── 2. Critic / red-team pass ───────────────────────────────────────────
    // A skeptical reviewer scores the draft against ISA-O3 ordering and fit.
    const assessment: { reviewed: boolean; revised: boolean; verdict?: string; summary?: string; repairNote?: string } = {
      reviewed: false,
      revised: false,
    };
    if (result.steps.length > 0) {
      try {
        const critique = await callClaude(
          apiKey,
          SYSTEM_INSTRUCTION,
          `You are red-teaming an ISA-O3 pattern recommendation. Be skeptical and specific.

CATALOGUE (ids must come from here):\n${catalogueStr}

SCENARIO:\n${enrichedScenario}

PROPOSED PATTERN:\n${JSON.stringify(result)}

Judge it on: (a) does the diagnosis match the scenario; (b) correct ordering - Intent before Scope before Approach, and higher horizons setting context for lower ones; (c) are the technique-to-artifact pairings sensible, not just valid; (d) right altitude (4-8 steps, no obvious missing gap); (e) every id exists in the catalogue; (f) is the recommendation anchored on a surface label (start-up, SAFe, project, enterprise, "ongoing Scrum") rather than the decisive variable (endpoint, demand, predictability, number of units, which constraint is fixed)? If so, return revise and name the variable it should have keyed on.

Return STRICT JSON only: { "verdict": "ok" | "revise", "issues": string[], "summary": "one short sentence" }. Use "revise" only for substantive problems, not nitpicks.`,
          1024,
        );
        assessment.reviewed = true;
        assessment.verdict = critique?.verdict === 'revise' ? 'revise' : 'ok';
        assessment.summary = typeof critique?.summary === 'string' ? critique.summary : undefined;

        // ── 3. Single repair pass if the critic found real problems ──────────
        // Trigger on verdict alone: the critique may land in issues[] or, if the
        // model put it there, in summary. Use whichever is present.
        const issues = Array.isArray(critique?.issues) ? critique.issues.filter((x: unknown) => typeof x === 'string') : [];
        const critiqueText = issues.length > 0
          ? issues.map((i: string) => `- ${i}`).join('\n')
          : (assessment.summary || '');
        if (assessment.verdict === 'revise' && critiqueText) {
          try {
            const repaired = await callClaude(
              apiKey,
              SYSTEM_INSTRUCTION,
              `CATALOGUE:\n${catalogueStr}\n\nSCENARIO:\n${enrichedScenario}\n\nYOUR PREVIOUS DRAFT:\n${JSON.stringify(result)}\n\nA reviewer raised these issues:\n${critiqueText}\n\nProduce an improved recommendation that resolves them. ${OUTPUT_SCHEMA_HINT}`,
            );
            const revisedResult = shapeResult(repaired, artifactIds, techniqueIds, idToName);
            if (revisedResult.steps.length > 0) {
              result = revisedResult;
              assessment.revised = true;
              assessment.repairNote = 'applied';
            } else {
              assessment.repairNote = 'empty-steps';
            }
          } catch (e) {
            assessment.repairNote = `threw:${(e as Error).message}`;
          }
        } else {
          assessment.repairNote = `no-trigger(verdict=${assessment.verdict},hasText=${!!critiqueText})`;
        }
      } catch (e) {
        assessment.repairNote = `critic-threw:${(e as Error).message}`;
      }
    }

    // Empty / fallback result
    if (result.steps.length === 0) {
      return json({
        success: true,
        data: { status: 'pattern', ...result, assessment, runId: null, empty: true },
      });
    }

    // ── Persist the run (for feedback linkage + future exemplars) ────────────
    let runId: string | null = null;
    try {
      const { data: run } = await supabase
        .from('pattern_builder_runs')
        .insert({
          scenario: enrichedScenario.slice(0, 4000),
          primary_horizon: result.primaryHorizon,
          result,
          assessment,
          was_revised: assessment.revised,
          user_id: userId,
        })
        .select('id')
        .single();
      runId = run?.id ?? null;
    } catch (_) { /* persistence is best-effort */ }

    return json({ success: true, data: { status: 'pattern', ...result, assessment, runId } });
  } catch (error) {
    console.error('recommend-pattern error:', error);
    return json({ success: false, error: (error as Error).message }, 500);
  }
});
