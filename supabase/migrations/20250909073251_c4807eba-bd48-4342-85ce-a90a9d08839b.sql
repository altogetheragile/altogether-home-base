-- Fix contacts table RLS policies to prevent public data exposure
-- This addresses the security finding: Customer Contact Information Could Be Harvested

-- First, drop any existing policies that might allow public access
DROP POLICY IF EXISTS "Allow insert for all users" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
DROP POLICY IF EXISTS "insert contact" ON public.contacts;

-- Ensure RLS is enabled
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert contact form submissions
CREATE POLICY "Authenticated users can insert contacts" 
ON public.contacts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow anonymous users to insert contact form submissions (for contact forms)
CREATE POLICY "Anonymous users can insert contacts" 
ON public.contacts 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Only admins can view contact data
CREATE POLICY "Only admins can view contacts" 
ON public.contacts 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Only admins can update contact data (if needed for admin management)
CREATE POLICY "Only admins can update contacts" 
ON public.contacts 
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Only admins can delete contact data
CREATE POLICY "Only admins can delete contacts" 
ON public.contacts 
FOR DELETE 
TO authenticated
USING (is_admin());