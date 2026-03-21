-- Add option_e, option_f, option_g columns for questions with more than 4 options
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_e text NOT NULL DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_f text NOT NULL DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS option_g text NOT NULL DEFAULT '';
