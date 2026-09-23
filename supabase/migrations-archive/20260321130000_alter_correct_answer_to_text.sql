-- Change correct_answer from character(1) to text to support multi-answer questions
ALTER TABLE public.questions ALTER COLUMN correct_answer TYPE text;
