-- Remove test templates that were created without actual file uploads
DELETE FROM public.knowledge_templates 
WHERE pdf_url IS NULL 
  AND pdf_filename IS NULL 
  AND template_type = 'canvas';