-- Pattern Builder: store each generated run (for feedback linkage and future
-- exemplar retrieval) and user thumbs-up/down feedback. Written only by edge
-- functions via the service role; readable by admins.

CREATE TABLE IF NOT EXISTS public.pattern_builder_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario text NOT NULL,
  primary_horizon text,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  assessment jsonb NOT NULL DEFAULT '{}'::jsonb,
  was_revised boolean NOT NULL DEFAULT false,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pattern_builder_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES public.pattern_builder_runs(id) ON DELETE CASCADE,
  rating text NOT NULL,           -- 'up' | 'down' (validated in the edge function)
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pattern_feedback_run ON public.pattern_builder_feedback(run_id);

ALTER TABLE public.pattern_builder_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_builder_feedback ENABLE ROW LEVEL SECURITY;

-- Admins can read; writes go through edge functions (service role bypasses RLS).
CREATE POLICY "Admins can view pattern builder runs"
  ON public.pattern_builder_runs FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view pattern builder feedback"
  ON public.pattern_builder_feedback FOR SELECT USING (is_admin());
