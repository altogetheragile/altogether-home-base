-- Fix contacts table security issue
-- First, drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anonymous users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only admins can delete contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only admins can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only admins can view contacts" ON public.contacts;

-- Ensure RLS is enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create secure policies for contacts table
-- Only allow public to insert contact form submissions (anonymous + authenticated)
CREATE POLICY "Public can submit contact forms" 
ON public.contacts 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view contact submissions
CREATE POLICY "Admins can view all contacts" 
ON public.contacts 
FOR SELECT 
USING (is_admin());

-- Only admins can update contact submissions
CREATE POLICY "Admins can update contacts" 
ON public.contacts 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Only admins can delete contact submissions
CREATE POLICY "Admins can delete contacts" 
ON public.contacts 
FOR DELETE 
USING (is_admin());