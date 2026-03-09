-- Fix the rating constraint to allow NULL values when no rating is provided
-- but enforce 1-5 range when a rating IS provided
ALTER TABLE public.kb_feedback 
DROP CONSTRAINT IF EXISTS kb_feedback_rating_check;

ALTER TABLE public.kb_feedback 
ADD CONSTRAINT kb_feedback_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));