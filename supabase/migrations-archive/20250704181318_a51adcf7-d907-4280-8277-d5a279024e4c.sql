-- Remove duplicate foreign key constraint that's causing Supabase query issues
ALTER TABLE public.event_registrations 
DROP CONSTRAINT IF EXISTS fk_event_registrations_event_id;