-- Keeps altogetheragile.com exactly as it is, after the change that lets a new site start empty.
--
-- Run this ONCE against production BEFORE deploying that change. Safe to run twice: every
-- statement is conditional on the value not already being set.
--
-- Why it is needed. A page renders the shipped default wherever the database has no row. Several
-- things that were hardcoded in the page, or shipped as defaults, are now empty by default, so
-- that a second site does not start out wearing this one's face, story and qualifications. This
-- site therefore has to say those things itself, in its own rows.
--
-- Nothing here is new content. Every value is what the pages render today.

-- 1. Five copy keys that were hardcoded in the page and now ship empty.
insert into public.site_copy (key, page, value, label, hint) values

  ('about.badges.list', 'about',
   'Associate Certified Coach (ACC)|/images/badges/acc.webp|https://www.credly.com/badges/aaac0b7b-dbd7-4560-ad51-f8d89a84f6cf/public_url
Professional Scrum Master II (PSM II)|/images/badges/psm-ii.webp|https://www.credly.com/badges/ab193ca2-d233-48a2-a264-55ee82a819c2/public_url
Business Agility Catalyst|/images/badges/business-agility-catalyst.webp|https://www.credly.com/badges/2e963763-78d4-43ba-92f4-3ce262e5f8b7/public_url',
   'Credential badges', 'One badge per line, as: name | image address | link to the verification page.'),

  ('about.timeline.list', 'about',
   'Late 1990s|Starting with systems, not people|Began in enterprise software - ERP implementations, data warehousing, systems analysis. Good technical grounding, but the most interesting problems were never the technical ones. They were the people ones.
Early 2000s|First encounter with agile|Working inside a large pharmaceutical organisation, I started experimenting with Scrum wrapped around DSDM for SAP rollouts - in environments where most people said it couldn''t work. It did. That was the turning point.
Mid 2000s|Leading teams, learning to coach|Moved into team leadership and consulting roles. Quickly found that the hard part of agile adoption was never the framework - it was the dynamics. How teams make decisions. How they handle uncertainty. How leaders get out of the way. Started coaching before I had a word for it.
2016|Going independent|Left the corporate world to run Altogether Agile full time. Started delivering Scrum and agile training alongside coaching and facilitation work. The goal from day one: practical, honest, grounded in real experience - not textbook agile.
2017 onwards|Building the training practice|Developed affiliate training relationships and began delivering APMG-accredited courses - AgilePM, AgileBA, Agile Digital Services. Each course sharpened the conviction that certification only sticks when it''s connected to real problems.
2020|Coaching, Westminster, and Management 3.0|Formalised the coaching practice. Became a licensed Management 3.0 Facilitator. Took on a Visiting Lectureship at the University of Westminster. The pandemic forced everything online - and proved that good facilitation is about the room you create, not the room you''re in.
Now|Still in it|Training, coaching, assessing, lecturing, and building the platform. In 2025 co-wrote the new version of AgilePM as one of the lead authors - the kind of work that only happens when you''ve been close to the practice long enough to have something worth saying. Still learning. Still finding it interesting.',
   'Timeline entries', 'One entry per line, as: when | what it was called | what happened.'),

  ('home.founder.quote', 'home',
   'Good agile training should be grounded in real experience - not slides recycled from a manual.',
   'Founder quote', 'The pulled-out line beside the orange rule.'),

  ('home.founder.years', 'home', '25',
   'Years of experience badge', 'The orange number on the photograph.'),

  ('home.founder.credentials', 'home',
   E'Lead Author, AgilePM3\nABC Level-4 Specialist\nAdvanced Certified Scrum Master\nABC Assessor\nAgileBA Module Author\nUniversity of Westminster Lecturer',
   'Credentials beside the photograph', 'One per line, kept short.'),

  -- The heading kept its apostrophe. The shipped wording spells it out, which reads oddly here.
  ('home.founder.heading', 'home',
   E'Train with someone\nwho''s been in the room.',
   'Founder heading', 'The large serif heading beside the photograph.')

on conflict (key) do nothing;


-- 2. The founder's photograph and portrait, which were the shipped defaults and are now empty.
update public.site_settings
   set brand = jsonb_set(
         jsonb_set(coalesce(brand, '{}'::jsonb), '{images,founderPhoto}',
                   to_jsonb('/images/alun.webp'::text), true),
         '{images,founderPortrait}', to_jsonb('/images/alun-illustrated.webp'::text), true)
 where id = '00000000-0000-0000-0000-000000000001'
   and coalesce(brand #>> '{images,founderPhoto}', '') = '';


-- 3. The founder's name and what the structured data claims about them. founder_name is null here
--    today and relied on a constant that said "Alun Davies-Baker"; that constant is now empty.
update public.site_settings set
  founder_name      = coalesce(nullif(trim(founder_name), ''), 'Alun Davies-Baker'),
  founder_role      = coalesce(nullif(trim(founder_role), ''), 'Agile Coach & Trainer'),
  founder_expertise = coalesce(nullif(trim(founder_expertise), ''),
                               E'AgilePM3 v2\nAgileBA v3\nAgile Project Management\nAgile Business Analysis\nScrum')
 where id = '00000000-0000-0000-0000-000000000001';


-- Check. Expect six rows, both image paths, and the three founder fields filled in.
select key from public.site_copy
 where key in ('about.badges.list','about.timeline.list','home.founder.quote',
               'home.founder.years','home.founder.credentials','home.founder.heading')
 order by key;

select brand #>> '{images,founderPhoto}'    as founder_photo,
       brand #>> '{images,founderPortrait}' as founder_portrait,
       founder_name, founder_role
  from public.site_settings
 where id = '00000000-0000-0000-0000-000000000001';
