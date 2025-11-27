-- Create project_artifacts table for storing various outputs from AI tools
CREATE TABLE public.project_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_project_artifacts_project_id ON public.project_artifacts(project_id);
CREATE INDEX idx_project_artifacts_type ON public.project_artifacts(artifact_type);

-- Enable RLS
ALTER TABLE public.project_artifacts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all artifacts
CREATE POLICY "Admins can manage all artifacts"
ON public.project_artifacts
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Users can view artifacts in their own projects
CREATE POLICY "Users can view their project artifacts"
ON public.project_artifacts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_artifacts.project_id
    AND p.created_by = auth.uid()
  )
);

-- Users can create artifacts in their own projects
CREATE POLICY "Users can create artifacts in their projects"
ON public.project_artifacts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_artifacts.project_id
    AND p.created_by = auth.uid()
  )
);

-- Users can update artifacts in their own projects
CREATE POLICY "Users can update their project artifacts"
ON public.project_artifacts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_artifacts.project_id
    AND p.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_artifacts.project_id
    AND p.created_by = auth.uid()
  )
);

-- Users can delete artifacts from their own projects
CREATE POLICY "Users can delete their project artifacts"
ON public.project_artifacts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_artifacts.project_id
    AND p.created_by = auth.uid()
  )
);

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER update_project_artifacts_updated_at
BEFORE UPDATE ON public.project_artifacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();