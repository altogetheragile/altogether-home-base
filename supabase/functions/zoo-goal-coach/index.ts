import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
import { callClaudeJSON } from "../_shared/anthropic.ts";

// Coaches a Product Goal for Build A Zoo.
//
// The wand used to be a regular expression. It reshaped text without reading it, so an objective
// and key results pasted in from work came back as "Open the people who start BestU carry on
// after an initial two-week period ... so that visitors love it and come back." Confidently
// phrased nonsense. Al had assumed the wand was AI; it is now.
//
// Auth-gated and rate-limited like the AI Product Owner, and the client falls back to the old
// mechanical reword whenever this cannot answer - signed out, offline, no key, rate limited. That
// matters: the game is playable without an account, and a wand that only works for some people is
// worse than one that always does something honest.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `You are coaching the Product Owner of "Build A Zoo", a Scrum training game. The
player is building a ZOO for visitors, in Sprints, and has just written a Product Goal.

The 2020 Scrum Guide: the Product Goal describes a FUTURE STATE OF THE PRODUCT. It is the single
long-term objective the Scrum Team plans against, held until it is met or abandoned. It says
nothing about the shape of the sentence, so a plain outcome is enough. Do not invent Scrum rules.

THE SHAPE THEY ARE WRITING IN matters. The game offers three, and the player has chosen one:

- "outcome": one sentence describing the future state of the product. All the Guide asks for.
- "okr": an objective, then the observable measures that would tell you it had happened. Several
  lines. Usually "Objective: ..." then "Key results: ...".
- "epic": "As a ... I want ... so that ...", with the measures as acceptance criteria.

ANSWER IN THE SHAPE THEY ARE USING. If they wrote an objective with key results, give back an
objective with key results - keeping every measure they wrote, in their words. Flattening an OKR
into one sentence throws away the measures, which are the part worth having and the part a Sprint
Review can hold the product up against. Only "outcome" is a single sentence.

THE SHAPE OF WHAT THEY WROTE WINS. You are told which shape is selected, but that is a hint and
it is often wrong: the selector is only set when the player clicks it, so somebody who simply
typed an objective and three measures into the box is marked "outcome". READ WHAT THEY WROTE. If
it is plainly an objective followed by measures, treat it as "okr" whatever the hint says, keep
every measure, and say in the note that you kept their measures. The same for an epic user story.
Never take a shape away from somebody who has clearly written in it.

Judge what they wrote and answer as JSON:

{
  "verdict": "good" | "reshaped" | "sprint_goal" | "off_theme",
  "goal": "the goal to put in the field",
  "note": "what you did and why, addressed to them as 'you', 2-3 sentences"
}

verdict rules:
- "off_theme": it is not about this zoo at all (a real goal from their work, another product).
  Then "goal" MUST be their text returned EXACTLY as given, changed in no way. Say it is not about
  the zoo, that you have left their words alone, and offer a way forward: what the park would have
  to become for that goal to be met.
- "sprint_goal": they named ONE THING TO BUILD (an enclosure, a cafe, a path). That is a fine
  Sprint Goal and too small to order a whole Product Backlog by. Keep their words and say what the
  park is like once it is there.
- "reshaped": it is about the zoo but is work, or a wish, rather than a future state. Keep their
  words and add the outcome for visitors - the part a Sprint Review can hold it up against.
- "good": already one objective describing the state of the park. Tidy the sentence at most, and
  say what makes it a Product Goal rather than praising it.

Never write the goal FROM NOTHING: the Product Goal is the Product Owner's to decide, and they
have had a go. Keep their words wherever you can and say what you changed. Never say "as an AI".
Plain British English, no em dashes, no exclamation marks.`;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const fail = (error: string, status: number) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return fail('Method not allowed', 405);
  if (!ANTHROPIC_API_KEY) return fail('ANTHROPIC_API_KEY not configured', 500);

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return fail('Unauthorized', 401);

  try {
    const { data: rateOk, error: rateErr } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: user.id, p_endpoint: 'zoo-goal-coach', p_max_requests: 60, p_window_minutes: 60,
    });
    if (!rateErr && rateOk === false) {
      return fail('Rate limit exceeded. Up to 60 goal rewordings per hour.', 429);
    }

    const body = await req.json();
    // Long enough for an objective with its key results, short enough that a paste of a whole
    // document cannot run up a bill.
    const goal = String(body.goal ?? '').slice(0, 1200).trim();
    if (!goal) return fail('No goal to reword', 400);
    const shapes = ['outcome', 'okr', 'epic'];
    const shape = shapes.includes(body.shape) ? body.shape : 'outcome';

    const raw = await callClaudeJSON({
      system: SYSTEM,
      prompt: `The shape selected in the game is "${shape}", which is only a hint - read what they `
        + `actually wrote and keep that shape if it differs.\n\nThe Product Owner wrote this Product `
        + `Goal:\n\n${goal}\n\nCoach it. Answer with the JSON object only.`,
      maxTokens: 1000,
      temperature: 0.3,
    });

    const verdicts = ['good', 'reshaped', 'sprint_goal', 'off_theme'];
    const verdict = verdicts.includes(raw?.verdict) ? raw.verdict : 'reshaped';
    const note = String(raw?.note ?? '').trim();
    // Their words back, whatever the model returned, when it says the goal is not about the zoo.
    // The one case where the answer must not be the model's text.
    const out = verdict === 'off_theme' ? goal : String(raw?.goal ?? '').trim();
    if (!out || !note) throw new Error('The coach did not answer in the shape expected.');

    return new Response(JSON.stringify({ success: true, data: { verdict, goal: out, note } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'The coach could not read that goal.', 500);
  }
});
