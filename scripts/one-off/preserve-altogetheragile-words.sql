-- Keeps altogetheragile.com saying what it says today, after the change that moves the last of the
-- words written into the pages onto the editor, where some of them now ship empty.
--
-- Run this ONCE against altogetheragile.com's production database BEFORE deploying that change,
-- and NOT against any other site's: on another site these are exactly the claims the change stops
-- making on its behalf. Safe to run twice: every row is skipped if it is already there.
--
-- Nothing here is new content. Every value is what the pages render today.

insert into public.site_copy (key, page, value, label, hint) values

  -- Shown on every course card. A promise about every course run, so it no longer ships.
  ('events.card.groupSize', 'events', 'Up to 12', 'Group size',
   'Shown on every card, for example "Up to 12". A promise about every course you run, so it starts empty. Leave it empty and it is left out')

on conflict (key) do nothing;

-- Check. Expect one row for each key above.
select key, value from public.site_copy where key in ('events.card.groupSize') order by key;
