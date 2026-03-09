
-- Update the foreign key constraint to SET NULL when an instructor is deleted
-- This allows events to remain but become "unassigned" when their instructor is deleted
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_instructor_id_fkey;

ALTER TABLE public.events 
ADD CONSTRAINT events_instructor_id_fkey 
FOREIGN KEY (instructor_id) 
REFERENCES public.instructors(id) 
ON DELETE SET NULL;
