-- Create canvases table for project canvas data
CREATE TABLE public.canvases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{"elements": [], "metadata": {}}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;

-- Create policies for canvas access
CREATE POLICY "Users can view canvases of their projects" 
ON public.canvases 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = canvases.project_id 
  AND p.created_by = auth.uid()
));

CREATE POLICY "Users can create canvases for their projects" 
ON public.canvases 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = canvases.project_id 
  AND p.created_by = auth.uid()
) AND auth.uid() = created_by);

CREATE POLICY "Users can update canvases of their projects" 
ON public.canvases 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = canvases.project_id 
  AND p.created_by = auth.uid()
));

CREATE POLICY "Admins can manage all canvases" 
ON public.canvases 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_canvases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_canvases_updated_at
BEFORE UPDATE ON public.canvases
FOR EACH ROW
EXECUTE FUNCTION public.update_canvases_updated_at();

-- Add index for better performance
CREATE INDEX idx_canvases_project_id ON public.canvases(project_id);

-- Enable realtime for collaborative editing
ALTER TABLE public.canvases REPLICA IDENTITY FULL;
SELECT cron.schedule('refresh_canvases_realtime', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY supabase_realtime.canvases;');

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE canvases;