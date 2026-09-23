-- The zoo game's teaching copy, editable from inside the game by an admin.
--
-- Overrides only: the code ships the default wording, and a row here replaces one string. Deleting
-- a row restores the shipped wording, which is what the editor's "Reset" does. Anyone can read
-- (the game needs the text before you sign in); only admins can write.

CREATE TABLE IF NOT EXISTS public.zoo_copy (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.zoo_copy ENABLE ROW LEVEL SECURITY;

-- The game is public, so the copy has to be readable by anyone playing it.
DROP POLICY IF EXISTS "zoo_copy readable by everyone" ON public.zoo_copy;
CREATE POLICY "zoo_copy readable by everyone"
  ON public.zoo_copy FOR SELECT
  USING (true);

-- Writing is an admin act: this text is what a room full of learners will read. Uses the existing
-- public.is_admin() helper rather than querying user_roles directly, like the rest of the schema.
DROP POLICY IF EXISTS "zoo_copy writable by admins" ON public.zoo_copy;
CREATE POLICY "zoo_copy writable by admins"
  ON public.zoo_copy FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
