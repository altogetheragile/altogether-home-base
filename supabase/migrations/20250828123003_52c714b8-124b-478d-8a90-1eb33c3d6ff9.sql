-- Fix security warning by updating the function with proper search_path
CREATE OR REPLACE FUNCTION public.update_import_statistics()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;