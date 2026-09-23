-- Every site has a settings row.
--
-- The App reads and writes site_settings WHERE id = '00000000-0000-0000-0000-000000000001', a
-- fixed id. On a database built from this repository that row does not exist, and an UPDATE
-- matching nothing is not an error in Postgres. So a new owner opens Admin, changes their company
-- name, clicks Save, is told nothing, and sees nothing change. They conclude the software is
-- broken, and they are right.
--
-- Found by standing up a second site, which is the only way it could have been found: on a site
-- that already had the row, everything worked.
--
-- The row is part of the schema rather than a step somebody has to remember. Defaults only: the
-- column defaults carry the flags, and the name and contact details are left null so a new site
-- shows its own emptiness rather than inheriting this one's identity.

INSERT INTO public.site_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
