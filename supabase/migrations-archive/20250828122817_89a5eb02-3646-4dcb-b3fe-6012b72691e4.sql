-- Create data imports tracking table
CREATE TABLE public.data_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('excel', 'csv', 'json')),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed', 'cancelled')),
  target_entity TEXT NOT NULL CHECK (target_entity IN ('knowledge_techniques', 'events', 'instructors', 'categories', 'tags', 'learning_paths')),
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  total_rows INTEGER DEFAULT 0,
  successful_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  mapping_config JSONB DEFAULT '{}'::jsonb,
  processing_log JSONB DEFAULT '[]'::jsonb,
  file_size INTEGER,
  original_filename TEXT
);

-- Create flexible staging data table
CREATE TABLE public.staging_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.data_imports(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  mapped_data JSONB DEFAULT '{}'::jsonb,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors JSONB DEFAULT '[]'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'skipped')),
  processing_errors JSONB DEFAULT '[]'::jsonb,
  target_record_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_data ENABLE ROW LEVEL SECURITY;

-- Create policies for data_imports
CREATE POLICY "Admins can manage all imports"
ON public.data_imports
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own imports"
ON public.data_imports
FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own imports"
ON public.data_imports
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Create policies for staging_data
CREATE POLICY "Admins can manage all staging data"
ON public.staging_data
FOR ALL
USING (is_admin());

CREATE POLICY "Users can view their staging data"
ON public.staging_data
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.data_imports di 
  WHERE di.id = staging_data.import_id 
  AND di.created_by = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_data_imports_status ON public.data_imports(status);
CREATE INDEX idx_data_imports_created_by ON public.data_imports(created_by);
CREATE INDEX idx_data_imports_created_at ON public.data_imports(created_at);
CREATE INDEX idx_staging_data_import_id ON public.staging_data(import_id);
CREATE INDEX idx_staging_data_status ON public.staging_data(validation_status, processing_status);
CREATE INDEX idx_staging_data_row_number ON public.staging_data(import_id, row_number);

-- Create function to update import statistics
CREATE OR REPLACE FUNCTION public.update_import_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.data_imports 
    SET 
      total_rows = (
        SELECT COUNT(*) 
        FROM public.staging_data 
        WHERE import_id = COALESCE(NEW.import_id, OLD.import_id)
      ),
      successful_rows = (
        SELECT COUNT(*) 
        FROM public.staging_data 
        WHERE import_id = COALESCE(NEW.import_id, OLD.import_id)
        AND processing_status = 'processed'
      ),
      failed_rows = (
        SELECT COUNT(*) 
        FROM public.staging_data 
        WHERE import_id = COALESCE(NEW.import_id, OLD.import_id)
        AND processing_status = 'failed'
      )
    WHERE id = COALESCE(NEW.import_id, OLD.import_id);
    
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic statistics updates
CREATE TRIGGER update_import_stats_trigger
  AFTER INSERT OR UPDATE OF processing_status ON public.staging_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_import_statistics();