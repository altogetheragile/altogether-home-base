-- Phase 2: Add subject and enquiry_type columns
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS enquiry_type TEXT NOT NULL DEFAULT 'general' 
CHECK (enquiry_type IN ('general', 'support', 'partnership', 'feedback', 'other'));

-- Phase 3: Add file attachment columns
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_filename TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Phase 3: Add status tracking column
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread' 
CHECK (status IN ('unread', 'read', 'resolved', 'spam'));

-- Phase 3: Add preferred contact method and phone
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email' 
CHECK (preferred_contact_method IN ('email', 'phone')),
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_enquiry_type ON public.contacts(enquiry_type, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_admin_view ON public.contacts(status, submitted_at DESC);

-- Phase 3: Create storage bucket for contact attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-attachments', 
  'contact-attachments', 
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Only admins can view contact attachments
DROP POLICY IF EXISTS "Admins can view contact attachments" ON storage.objects;
CREATE POLICY "Admins can view contact attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contact-attachments' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- RLS: Authenticated users can upload contact attachments
DROP POLICY IF EXISTS "Users can upload contact attachments" ON storage.objects;
CREATE POLICY "Users can upload contact attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contact-attachments' 
  AND auth.uid() IS NOT NULL
);

-- RLS: Users can delete their own attachments within 1 hour
DROP POLICY IF EXISTS "Users can delete recent attachments" ON storage.objects;
CREATE POLICY "Users can delete recent attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contact-attachments' 
  AND auth.uid() IS NOT NULL
  AND (EXTRACT(EPOCH FROM (now() - created_at)) < 3600)
);