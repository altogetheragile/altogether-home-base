-- Fix knowledge_templates template_type check to allow 'pdf'
ALTER TABLE public.knowledge_templates
DROP CONSTRAINT IF EXISTS knowledge_templates_template_type_check;

ALTER TABLE public.knowledge_templates
ADD CONSTRAINT knowledge_templates_template_type_check
CHECK (template_type IN ('canvas','matrix','worksheet','process','form','pdf'));

-- Ensure default remains pdf
ALTER TABLE public.knowledge_templates
ALTER COLUMN template_type SET DEFAULT 'pdf';