import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://altogetheragile.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public endpoint: records a thumbs-up/down (+ optional comment) for a Pattern
// Builder run. Inserts via the service role so the tables stay locked down.
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
    const { runId, rating, comment } = await req.json().catch(() => ({}));

    if (!runId || typeof runId !== 'string') {
      return json({ success: false, error: 'Missing runId' }, 400);
    }
    if (rating !== 'up' && rating !== 'down') {
      return json({ success: false, error: 'rating must be "up" or "down"' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Ensure the run exists before recording feedback against it.
    const { data: run, error: runErr } = await supabase
      .from('pattern_builder_runs')
      .select('id')
      .eq('id', runId)
      .single();
    if (runErr || !run) return json({ success: false, error: 'Unknown runId' }, 404);

    const { error } = await supabase.from('pattern_builder_feedback').insert({
      run_id: runId,
      rating,
      comment: typeof comment === 'string' ? comment.slice(0, 2000) : null,
    });
    if (error) throw error;

    return json({ success: true });
  } catch (error) {
    console.error('pattern-builder-feedback error:', error);
    return json({ success: false, error: (error as Error).message }, 500);
  }
});
