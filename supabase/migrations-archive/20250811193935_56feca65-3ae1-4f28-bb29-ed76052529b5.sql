-- Fix kb_feedback insert policy (remove invalid NEW reference)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'kb_feedback' AND policyname = 'Authenticated users can submit feedback'
  ) THEN
    DROP POLICY "Authenticated users can submit feedback" ON public.kb_feedback;
  END IF;
END $$;

CREATE POLICY "Authenticated users can submit feedback"
ON public.kb_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));
