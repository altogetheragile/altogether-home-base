-- A site can say it is not ready yet.
--
-- A site goes live the moment its domain resolves, which is long before anybody has written its
-- words. The second site built from this repository spent a day publicly reachable with stats
-- called "Stat 1", a headline it had inherited, a footer tagline describing somebody else's
-- business, and a primary button pointing at a page that answered Not Found. Every one of those
-- was visible to anybody who found it, and to anything that crawled it.
--
-- There was no way to say "not yet" short of taking the domain down, which also takes down the
-- editor used to finish the site.
--
-- So: one switch. Visitors get a holding page. An administrator gets the real site, so the thing
-- being built can be looked at while it is being built, which is the whole point.
--
-- Default false, because an existing site is already live and must stay that way. A new site is
-- expected to turn it on, and the setup page says so.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS under_construction boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.site_settings.under_construction IS
  'Whether visitors see a holding page instead of the site. Administrators always see the real site. Off by default so an existing site is unaffected.';
