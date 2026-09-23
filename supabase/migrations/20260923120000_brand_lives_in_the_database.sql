-- The brand, as data.
--
-- Colours were decided at build time: a second site meant a second build. Both apps now render
-- from CSS custom properties, so the only thing missing is somewhere to put the values.
--
-- One jsonb column rather than twelve text columns, because the set of tokens is defined in code
-- (packages/ui/src/tokens.ts) and a site overrides whatever subset it cares about. Adding a token
-- later should not need a migration.
--
-- Shape, all keys optional:
--   { "colors": { "orange": "#FF9715", "deepTeal": "#004D4D" } }
--
-- Empty means "use the tokens", which is what every existing row gets. resolveColors() in
-- @altogether/ui drops anything that is not a six-digit hex, so a typo costs one colour rather
-- than the site.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS brand jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.site_settings.brand IS
  'Per-site brand overrides. { "colors": { "<token>": "#RRGGBB" } }. Absent keys fall back to the design tokens in @altogether/ui.';
