-- What a site claims about its founder, in the structured data a search engine reads.
--
-- These two were hardcoded: every site built from this repository told Google its founder was an
-- "Agile Coach & Trainer" who knew about AgilePM3 v2 and AgileBA v3. That is a claim about a named
-- person, attributed to whoever the site says its founder is. It has to be theirs to make.
--
-- Both default to null, so a site that says nothing claims nothing, and the block is left out of
-- the structured data entirely rather than emitted empty.

alter table public.site_settings
  add column if not exists founder_role text,
  add column if not exists founder_expertise text;

comment on column public.site_settings.founder_role is
  'The founder''s job title in Organization structured data, for example "Agile Coach". Null claims none.';
comment on column public.site_settings.founder_expertise is
  'What the founder is an authority on, one per line, for schema.org knowsAbout. Null claims none.';
