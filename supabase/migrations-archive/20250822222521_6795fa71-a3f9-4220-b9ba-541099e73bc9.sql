-- Fix canvases table migration issues
-- Remove the problematic cron.schedule line and fix realtime setup

-- The canvases table already exists, so we just need to fix the realtime setup
-- First, ensure the table is properly added to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- Ensure proper realtime setup for canvases table
ALTER TABLE public.canvases REPLICA IDENTITY FULL;

-- Verify RLS policies exist (they should from the previous migration)
-- If not, recreate them
DO $$ 
BEGIN
  -- Check if policies exist and create them if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'canvases' AND policyname = 'Users can view canvases of their projects'
  ) THEN
    CREATE POLICY "Users can view canvases of their projects" 
    ON public.canvases 
    FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = canvases.project_id AND p.created_by = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'canvases' AND policyname = 'Users can create canvases for their projects'
  ) THEN
    CREATE POLICY "Users can create canvases for their projects" 
    ON public.canvases 
    FOR INSERT 
    WITH CHECK (EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = canvases.project_id AND p.created_by = auth.uid()
    ) AND auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'canvases' AND policyname = 'Users can update canvases of their projects'
  ) THEN
    CREATE POLICY "Users can update canvases of their projects" 
    ON public.canvases 
    FOR UPDATE 
    USING (EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = canvases.project_id AND p.created_by = auth.uid()
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'canvases' AND policyname = 'Admins can manage all canvases'
  ) THEN
    CREATE POLICY "Admins can manage all canvases" 
    ON public.canvases 
    FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;