-- A site publishes its own terms, or none.
--
-- The Terms, Privacy and Cookie pages are this company's legal documents: company number 10695166,
-- a registered office in Watford, and liability wording drafted for one business. A second site
-- built from this repository published all of it, under its own domain, as though it were theirs.
--
-- There is no templating a company registration number. So these pages are switched off by
-- default, and their footer links go with them. A site turns them on when it has written its own.
-- Serving nothing is bad; serving somebody else's terms is worse, because it looks deliberate.
--
-- Default false, so a new database gets pages that are not published. altogetheragile.com, which
-- has written its own, is switched on separately.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_legal boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.site_settings.show_legal IS
  'Whether the Terms, Privacy and Cookie pages are published. Off by default: they are per-company legal documents and cannot be inherited.';
