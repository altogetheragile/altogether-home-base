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

interface Turn { role: 'user' | 'coach'; text: string }
interface HarvestRequest {
  conversation: Turn[];
  intentStatement?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Destinations map onto the Vision to Value pipeline tools.
const DESTINATIONS = ['goal', 'backlog', 'probe', 'benefit', 'persona', 'agreement', 'note'] as const;

const SYSTEM_HARVEST = `You are an agile coach closing a coaching conversation with a "harvest": you read back what the person said and propose where each useful thing could live, so nothing is lost. You never invent content. Every harvested item must be drawn from the person's own words in the conversation.

For each item choose ONE destination:
- "goal": a measurable goal or the change they want to see in the world (Impact Map).
- "backlog": a candidate piece of work, a story or an idea to build (Product Backlog).
- "probe": an assumption or option worth running as a small safe-to-fail experiment (Probe Tracker).
- "benefit": an outcome or measure they want to track over time (Benefits Scorecard).
- "persona": a person, role or user they described (Persona Studio).
- "agreement": a way of working or team agreement (Ways of Working).
- "note": something worth keeping that does not fit the above.

Keep each "text" concise and in the person's own words. Give a short, warm "rationale" for the placement. Do not propose more than eight items. Do not include things the person did not say.
British English. Do not use em dashes. Do not use the word "aporetic".

Reply strictly as JSON: { "summary": string, "items": [ { "text": string, "destination": "goal|backlog|probe|benefit|persona|agreement|note", "rationale": string } ] }.`;

function buildPrompt(req: HarvestRequest): string {
  const transcript = (req.conversation ?? [])
    .map((t) => `${t.role === 'user' ? 'Person' : 'Coach'}: ${t.text}`)
    .join('\n') || '(no conversation yet)';
  return [
    req.intentStatement ? `The initiative exists to: ${req.intentStatement}.` : '',
    'Here is the coaching conversation to harvest:',
    transcript,
    '',
    'Produce a brief warm summary and the harvested items, each placed at one destination.',
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

  let body: HarvestRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!Array.isArray(body?.conversation) || body.conversation.length === 0) {
    return json({ error: 'conversation is required' }, 400);
  }

  try {
    const content = await callClaudeJSON({
      system: SYSTEM_HARVEST,
      prompt: buildPrompt(body),
      maxTokens: 3000,
      temperature: 0.4,
    });
    const parsed = JSON.parse(content) as { summary?: string; items?: Array<{ text?: string; destination?: string; rationale?: string }> };
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .filter((i) => typeof i?.text === 'string' && i.text.trim())
          .map((i) => ({
            text: String(i.text).trim(),
            destination: (DESTINATIONS as readonly string[]).includes(String(i.destination)) ? String(i.destination) : 'note',
            rationale: typeof i.rationale === 'string' ? i.rationale : '',
          }))
      : [];
    return json({ summary: typeof parsed.summary === 'string' ? parsed.summary : '', items });
  } catch (err) {
    console.error('coach-harvest error:', err);
    return json({ error: 'Harvest failed' }, 502);
  }
});
