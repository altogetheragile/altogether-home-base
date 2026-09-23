-- The site is not its founder.
--
-- A second site rendered this one's founder: his photograph above the fold on the home page, his
-- name in the Person structured data, and a first-person paragraph introducing him. None of it was
-- switchable and none of it was editable.
--
-- Two columns. The words live in `site_copy` and the photographs in `site_settings.brand.images`,
-- both of which already exist; these are the two facts that fit neither.
--
--   show_founder  whether this site has a founder section at all. Some will not: a co-operative,
--                 a partnership, a business that would rather lead with its work.
--   founder_name  the person named in structured data and in image alt text, where a sentence
--                 from site_copy would be the wrong shape.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_founder boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS founder_name text;

COMMENT ON COLUMN public.site_settings.show_founder IS
  'Whether the site renders a founder section (home page portrait, About page bio). Off means it is not rendered at all.';
COMMENT ON COLUMN public.site_settings.founder_name IS
  'The person named in Person structured data and image alt text. Null falls back to the shipped default.';
