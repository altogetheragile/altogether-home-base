import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
import { callClaudeJSON } from '../_shared/anthropic.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CoachMode = 'coach' | 'guide' | 'session';
interface Turn { role: 'user' | 'coach'; text: string }
interface ReflectRequest {
  tool: string;
  cellTag: string;
  question: string;
  stretch: string;
  intentStatement?: string;
  conversation: Turn[];
  mode?: CoachMode;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SYSTEM_COACH = `You are an experienced agile coach following ICF-style, non-directive practice, helping someone fill one cell of a planning artifact through conversation.
Rules:
- Ask ONE open question at a time and follow what the person actually said. Do not stack questions.
- Never write the content for them and never invent facts. The cell must end up in the user's own words.
- After two or three of the person's replies, offer the provided "stretch" question once, gently and in coaching voice. Never label it a challenge.
- When you have enough, produce a "reflection" (begin "Here is what I heard ...", spoken back warmly) AND a "draft": the cell value composed ONLY from the user's own words, concise, with no preamble. Then set done to true.
- Tone: open, curious, unhurried. British English. Do not use em dashes. Do not use the word "aporetic".
Reply strictly as JSON: { "next_question": string optional, "reflection": string optional, "draft": string optional, "done": boolean }. Provide next_question on its own, OR reflection + draft together.`;

const SYSTEM_GUIDE = `You are stepping briefly out of coaching, with the person's permission, to act as a guide. Offer concise, practical suggestions for this cell. Be clear these are options, not instructions. British English, no em dashes.
Reply strictly as JSON: { "reflection": string, "done": boolean }.`;

const SYSTEM_SESSION = `You are an experienced agile coach in a standalone coaching conversation on whatever topic the person brings. This is not tied to filling a single field, so keep exploring with them.
Rules:
- Ask ONE open question at a time and follow what the person actually said. Do not stack questions.
- Never tell them what to do and never invent facts. Help them think in their own words.
- Open by contracting: ask what would make this conversation useful to them.
- After a few exchanges, offer the provided "stretch" question once, gently and in coaching voice. Never label it a challenge.
- Do not try to wrap up or summarise unless the person asks; keep done false. The person will choose when to harvest the conversation.
- Tone: open, curious, unhurried. British English. Do not use em dashes. Do not use the word "aporetic".
Reply strictly as JSON: { "next_question": string, "done": boolean }.`;

function buildPrompt(req: ReflectRequest): string {
  const transcript = (req.conversation ?? [])
    .map((t) => `${t.role === 'user' ? 'Person' : 'Coach'}: ${t.text}`)
    .join('\n') || '(no conversation yet)';
  const userTurns = (req.conversation ?? []).filter((t) => t.role === 'user').length;
  return [
    `Tool: ${req.tool}. Cell: ${req.cellTag}.`,
    req.intentStatement ? `The initiative exists to: ${req.intentStatement}.` : '',
    `The opening question for this cell is: "${req.question}"`,
    `The stretch question to offer after a few exchanges is: "${req.stretch}"`,
    `Number of replies the person has given so far: ${userTurns}.`,
    '',
    'Conversation so far:',
    transcript,
    '',
    userTurns === 0
      ? 'Open the cell: ask the opening question in your own warm phrasing (next_question).'
      : 'Continue the conversation per the rules: another open question, or the stretch, or a reflection if ready.',
  ].filter(Boolean).join('\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'AI is not configured' }, 500);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  let body: ReflectRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body?.tool || !body?.cellTag || typeof body.question !== 'string') {
    return json({ error: 'tool, cellTag and question are required' }, 400);
  }

  const mode: CoachMode = body.mode === 'guide' ? 'guide' : body.mode === 'session' ? 'session' : 'coach';
  const system = mode === 'guide' ? SYSTEM_GUIDE : mode === 'session' ? SYSTEM_SESSION : SYSTEM_COACH;

  try {
    const content = await callClaudeJSON({
      system,
      prompt: buildPrompt(body),
      maxTokens: 2000,
      temperature: 0.6,
    });
    const parsed = JSON.parse(content) as { next_question?: string; reflection?: string; draft?: string; done?: boolean };
    return json({
      next_question: typeof parsed.next_question === 'string' ? parsed.next_question : undefined,
      reflection: typeof parsed.reflection === 'string' ? parsed.reflection : undefined,
      draft: typeof parsed.draft === 'string' ? parsed.draft : undefined,
      done: Boolean(parsed.done),
    });
  } catch (err) {
    console.error('coach-reflect error:', err);
    return json({ error: 'Coaching response failed' }, 502);
  }
});
