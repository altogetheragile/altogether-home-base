import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
import { callClaudeJSON } from "../_shared/anthropic.ts";

// The single-player AI Product Owner for Build A Zoo. Given the current Backlog and what
// the visitors are asking for, it does the PO's ONGOING REFINEMENT: splits epics into
// stories, re-orders the Backlog by VALUE, adds new PBIs from visitor signals / the
// Product Goal, and clarifies acceptance criteria. It NEVER estimates effort - that is the
// Developers' job (planning poker). Auth-gated + rate-limited; the client applies the
// returned decisions to the game state.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `You are running a PRODUCT BACKLOG REFINEMENT session for a Scrum training game
called "Build A Zoo". Refinement is the whole Scrum Team's work, not the Product Owner's alone, so
you speak for two of the three accountabilities and say which is speaking:

- The PRODUCT OWNER brings value: what matters most to visitors, in what order, and what an item
  really has to do to be worth building.
- The DEVELOPERS bring feasibility: what is too big to finish in a Sprint, what is unclear, what
  depends on something else being built first.

The player is a Developer. They do the sizing, always - never return estimates or story points.
The Scrum Guide: "The Developers who will be doing the work are responsible for the sizing. The
Product Owner may influence the Developers by helping them understand and select trade-offs."

Between you, you may:
- SPLIT an epic (a themed area like "Savanna") into smaller PBIs - its animals and facilities.
  Say whether the split is by value (the PO) or because it cannot be finished in a Sprint (the
  Developers).
- RE-ORDER the Backlog by VALUE (what gives visitors the most, soonest), highest value first.
  This one is the Product Owner's call.
- ADD new PBIs, especially in response to visitor signals (e.g. "unmet:food" -> a food outlet)
  and to serve the Product Goal.
- CLARIFY a PBI's acceptance criteria (make them sharper, testable, outcome-focused). The
  Developers ask; the Product Owner answers.

Hard rules (Scrum fidelity):
- Never estimate. Sizing belongs to the Developers, who are the player.
- Keep acceptance criteria short and testable. Keep names concise.
- Only reference item ids and epic member ids that appear in the input. For a new zone use
  a sensible zone name.
- Be decisive but conservative: a few high-value moves, not a rewrite.
- Do NOT propose a Sprint Goal. The Sprint Goal is crafted by the whole Scrum Team at Sprint
  Planning. Do not mention it in the rationale either.
- In the rationale, attribute what was done: say when it was the Product Owner ordering by value
  and when it was the Developers flagging something too big or unclear. Two or three sentences.

Backlog item categories: epic, enclosure, exhibit (animal), amenity (facility), flora.

Return a single JSON object with this exact shape:
{
  "rationale": "1-3 sentences: what you changed and why, in the PO's voice",
  "splitEpics": [ { "epicId": "id", "memberIds": ["memberId", ...] } ],
  "order": ["itemId", ...],            // backlog item ids, most valuable first (subset is fine)
  "newItems": [ { "name": "string", "category": "exhibit|amenity|flora", "zone": "string", "services": "food|toilet|rest (amenity only, optional)", "acceptance": ["string", ...] } ],
  "refine": [ { "id": "itemId", "acceptance": ["string", ...] } ]
}
Any array may be empty. Do not include estimates or points anywhere.`;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Auth: the AI PO is a signed-in, rate-limited feature (protects API budget).
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { data: rateOk, error: rateErr } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: user.id, p_endpoint: 'zoo-po-refine', p_max_requests: 40, p_window_minutes: 60,
    });
    if (!rateErr && rateOk === false) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Up to 40 PO refinements per hour.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    // Compact the game context so the model sees only what it needs.
    const context = {
      productGoal: String(body.productGoal ?? '').slice(0, 300),
      sprintNumber: Number(body.sprintNumber ?? 1),
      signals: Array.isArray(body.signals) ? body.signals.slice(0, 10) : [],
      backlog: Array.isArray(body.backlog) ? body.backlog.slice(0, 60) : [],
    };

    const prompt = `Current game context (JSON):\n${JSON.stringify(context)}\n\nRefine the Backlog now. Return only the JSON object.`;
    const raw = await callClaudeJSON({ system: SYSTEM, prompt, maxTokens: 1500, temperature: 0.4 });

    let decisions: unknown;
    try {
      decisions = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: 'The PO returned an unreadable plan. Please try again.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, data: decisions }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('zoo-po-refine error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
