-- Create certification_bodies reference table
CREATE TABLE public.certification_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certification_bodies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view certification_bodies"
  ON public.certification_bodies FOR SELECT USING (true);

CREATE POLICY "Admins can manage certification_bodies"
  ON public.certification_bodies FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Seed with known certification bodies
INSERT INTO public.certification_bodies (name) VALUES
  ('APMG'),
  ('Scrum Alliance'),
  ('Scrum.org');

-- Add FK column to event_templates
ALTER TABLE public.event_templates
  ADD COLUMN certification_body_id uuid REFERENCES public.certification_bodies(id) ON DELETE SET NULL;

-- Migrate existing text data to FK
UPDATE public.event_templates et
  SET certification_body_id = cb.id
  FROM public.certification_bodies cb
  WHERE et.certification_body = cb.name;

-- Drop the old text column
ALTER TABLE public.event_templates
  DROP COLUMN certification_body;
