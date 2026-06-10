import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Level = 'actors' | 'impacts' | 'deliverables';

interface SuggestRequest {
  level: Level;
  goal: string;
  actor?: string;
  impact?: string;
  existing?: string[];
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SYSTEM_PROMPT = `You are an expert agile coach facilitating an Impact Mapping session (the technique by Gojko Adzic).
An impact map is a four-level hierarchy: GOAL (a measurable business objective) -> ACTORS (people or roles who can help or hinder the goal) -> IMPACTS (the behaviour changes we want from an actor, including behaviours that hinder the goal) -> DELIVERABLES (features or activities that might cause an impact; these are options to test, not commitments).
Always reply with strict JSON of the form {"suggestions": ["...", "..."]}. Each suggestion is a short, concrete phrase (no numbering, no trailing punctuation). Do not repeat any items the user already has.`;

function buildUserPrompt(req: SuggestRequest): string {
  const existing = (req.existing ?? []).filter(Boolean);
  const avoid = existing.length ? `\nDo not repeat these existing items: ${existing.map((e) => `"${e}"`).join(', ')}.` : '';
  switch (req.level) {
    case 'actors':
      return `Goal: "${req.goal}".\nSuggest 4 to 6 ACTORS (people or roles) whose behaviour could help or hinder this goal. Include at least one actor who might hinder it.${avoid}`;
    case 'impacts':
      return `Goal: "${req.goal}".\nActor: "${req.actor}".\nSuggest 3 to 5 IMPACTS: behaviour changes we want from this actor (or behaviours that could hinder the goal), each as a short phrase such as "Sign up faster" or "Recommend us to others".${avoid}`;
    case 'deliverables':
      return `Goal: "${req.goal}".\nActor: "${req.actor}".\nImpact: "${req.impact}".\nSuggest 3 to 5 DELIVERABLES: features, changes, or activities that could cause this impact. Keep each concise.${avoid}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!openAIApiKey) return json({ error: 'OpenAI API key not configured' }, 500);

  // Require an authenticated user (consistent with the other AI functions).
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  let body: SuggestRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body || !['actors', 'impacts', 'deliverables'].includes(body.level)) {
    return json({ error: 'Invalid "level"' }, 400);
  }
  if (typeof body.goal !== 'string' || body.goal.trim().length === 0) {
    return json({ error: 'A goal is required before generating suggestions' }, 400);
  }
  if (body.level !== 'actors' && !body.actor) return json({ error: 'An actor is required' }, 400);
  if (body.level === 'deliverables' && !body.impact) return json({ error: 'An impact is required' }, 400);

  // Guard against oversized input.
  const truncate = (s?: string) => (s ? s.slice(0, 500) : s);
  const safeReq: SuggestRequest = {
    level: body.level,
    goal: truncate(body.goal)!,
    actor: truncate(body.actor),
    impact: truncate(body.impact),
    existing: Array.isArray(body.existing) ? body.existing.slice(0, 30).map((e) => String(e).slice(0, 200)) : [],
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(safeReq) },
        ],
        max_tokens: 400,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return json({ error: 'AI generation failed' }, 502);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return json({ error: 'Empty response from AI' }, 502);

    let parsed: { suggestions?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: 'Could not parse AI response' }, 502);
    }

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0 && s.length <= 200)
          .slice(0, 8)
      : [];

    return json({ suggestions });
  } catch (err) {
    console.error('generate-impact-map error:', err);
    return json({ error: 'AI generation failed' }, 500);
  }
});
