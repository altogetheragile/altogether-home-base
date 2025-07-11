-- Create storage bucket for knowledge base images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge-base', 'knowledge-base', true);

-- Create storage policies for knowledge base images
CREATE POLICY "Knowledge base images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'knowledge-base');

CREATE POLICY "Admins can upload knowledge base images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'knowledge-base' AND is_admin());

CREATE POLICY "Admins can update knowledge base images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'knowledge-base' AND is_admin());

CREATE POLICY "Admins can delete knowledge base images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'knowledge-base' AND is_admin());

-- Add image_url column to knowledge_techniques table
ALTER TABLE knowledge_techniques 
ADD COLUMN image_url TEXT;