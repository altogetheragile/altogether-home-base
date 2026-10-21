-- Keeps the coaching illustration on altogetheragile.com, after the change that makes it a
-- picture field which ships empty (coaching.approach.picture).
--
-- Run this ONCE against altogetheragile.com's production database BEFORE deploying that change,
-- and NOT against any other site's: on another site the illustration is exactly what the change
-- takes away. Safe to run twice: it does nothing if the row is already there.
--
-- Nothing here is new content. It is the picture the page drew from a path written into it.

insert into public.site_copy (key, page, value, label, hint)
values ('coaching.approach.picture', 'coaching',
        '{"src":"/images/coaching-hero.webp","alt":"Two people having a coaching conversation"}',
        'Approach picture',
        'Beside the approach words, on pale teal. Upright pictures suit it best. Leave it empty and the words take the full width.')
on conflict (key) do nothing;

-- Check. Expect one row whose value names coaching-hero.webp.
select key, value from public.site_copy where key = 'coaching.approach.picture';
