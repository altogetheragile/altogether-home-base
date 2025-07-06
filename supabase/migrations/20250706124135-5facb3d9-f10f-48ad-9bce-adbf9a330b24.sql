-- Create storage bucket for hero background images
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-backgrounds', 'hero-backgrounds', true);

-- Create policy for public access to hero background images
CREATE POLICY "Public can view hero background images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hero-backgrounds');

-- Create policy for admins to upload hero background images
CREATE POLICY "Admins can upload hero background images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'hero-backgrounds' AND is_admin());