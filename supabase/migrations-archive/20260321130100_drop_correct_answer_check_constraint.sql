-- Drop the check constraint that only allows single letters A-D
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;
