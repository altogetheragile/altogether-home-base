import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
import { callClaudeJSON } from "../_shared/anthropic.ts";

// Starter wording for one page of a site, from the owner's description of the business.
//
// Called by the Site's setup page, once per page, with the boxes that page still has empty and
// what each one is for. Answers key to wording. It writes nothing: the Site checks every value and
// saves what passes as a draft, so nothing reaches a visitor until the owner has read it.
//
// Admin only, because it spends the site's API budget and because only an administrator can save
// what it returns anyway. Rate-limited for the same reason.

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const SYSTEM = `You write starter wording for a small business website, from the owner's own description of the business. The owner will read every word before it is published, and will rewrite what does not sound like them. Your job is a good first draft that fits their business, not a finished site.

You are given one page of the site and the boxes on it that are still empty. Each box has a label and a hint saying where it appears and what it is for, and a rough length in words. Write wording for each box that does what its hint describes.

The page names, box labels and hints come from a website template first written for an agile training and coaching business. They say where each box sits on the page, not what this business does, so translate them. A page called "Coaching" is where this business describes what it offers. A "chemistry session" is whatever free first conversation this business offers, if it offers one. "Courses", "events" and "workshops" are whatever this business runs that people sign up for. Never mention coaching, training, courses, Scrum, agile or certification unless the owner's description does. Every sentence must make sense for the business described and for no other.

Rules, in order of importance:
1. Never state anything checkable that the description does not say. No numbers of clients, years, sessions, ratings or prices. No qualifications, accreditations, awards, memberships, client names, locations, or quotations. No biography of a named person. Where a box seems to want one of these, write around it in general terms, or leave the box out.
2. Write for this business and its customers, in plain British English. Speak as the business ("we", or "I" if the description is clearly one person). Keep a warm, direct, unhyped tone. No buzzwords, no exclamation marks.
3. Match the rough length given. A button is two to five words. A heading is a short line. A paragraph is two to four sentences.
4. Headings use Title Case. Never use em dashes or en dashes; use commas or full stops. Never use the word "certified".
5. If a box's hint says a line break splits it, you may put one "\\n" in it.

Box kinds:
- "text": answer with a string.
- "lines": answer with an array of short strings, one per line, usually three to five.
- "items": answer with an array of objects, three or four of them unless the hint suggests otherwise, each using exactly the row keys given. Fill every required key.

Return one JSON object: { "values": { "<box key>": <answer>, ... } }. Leave out any box you cannot fill without breaking rule 1.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY is not set on this project.' }, 500);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  // The same precedence the Site and the App use: user_roles first, then profiles.role for the
  // accounts that predate it.
  const { data: hasRole } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  const { data: profile } = hasRole === true
    ? { data: null }
    : await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (hasRole !== true && profile?.role !== 'admin') {
    return json({ error: 'Only an administrator can write starter wording.' }, 403);
  }

  try {
    const { data: rateOk, error: rateErr } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: user.id, p_endpoint: 'draft-site-copy', p_max_requests: 60, p_window_minutes: 60,
    });
    if (!rateErr && rateOk === false) {
      return json({ error: 'That is a lot of starter wording for one hour. Try again later.' }, 429);
    }

    const body = await req.json();
    const brief = String(body.brief ?? '').trim().slice(0, 3000);
    if (!brief) return json({ error: 'There is no description of the business to write from.' }, 400);
    const fields = (Array.isArray(body.fields) ? body.fields : []).slice(0, 40);
    if (!fields.length) return json({ success: true, values: {} });

    const prompt = [
      `The business, in the owner's words:\n${brief}`,
      `Site name: ${String(body.siteName ?? '').slice(0, 120) || '(not set yet)'}`,
      `This page: ${String(body.page ?? '').slice(0, 80)}`,
      `The empty boxes (JSON):\n${JSON.stringify(fields)}`,
      'Write the starter wording now. Return only the JSON object.',
    ].join('\n\n');

    // Generous: forty boxes, some of them lists of rows, run long, and a reply cut short is
    // unreadable JSON rather than a shorter answer.
    const raw = await callClaudeJSON({ system: SYSTEM, prompt, maxTokens: 12000, temperature: 0.6 });

    let parsed: { values?: Record<string, unknown> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: 'The starter wording came back unreadable. Please try that page again.' }, 502);
    }
    return json({ success: true, values: parsed.values ?? {} });
  } catch (error) {
    console.error('draft-site-copy error:', error);
    return json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
