-- Move the "Who is this for" cards and the philosophy cards into lists.
--
-- Additive and inert while the deployed code still reads the numbered keys, so it runs BEFORE the
-- merge rather than after: expand, migrate, contract. Already run against production.
--
-- The old numbered rows are left in place. Nothing reads them once the new code is live, and
-- leaving them means this is undone by simply not deploying.

insert into public.site_copy (key, page, value, label, hint)
values
  ('home.personas.items', 'home',
   '[
  {
    "heading": "Moving into agile",
    "body": "You''re a project manager, BA, or team lead transitioning to agile ways of working and need grounded, practical guidance - not just theory."
  },
  {
    "heading": "Seeking certification",
    "body": "You want a grounded, framework-based course - Scrum, AgileBA, AgilePM, or Kanban - delivered by someone who has contributed to the frameworks and knows them inside out."
  },
  {
    "heading": "Building team agility",
    "body": "You''re a leader trying to grow genuine organisational agility - and you need a coach who understands both the human and structural side of change."
  }
]',
   'Who is this for, cards', 'One card per kind of person you work with. Add or remove as many as you like; leave it empty and the whole section disappears.'),
  ('about.philosophy.items', 'about',
   '[
  {
    "label": "Training",
    "heading": "Learning that transfers.",
    "body": "Most agile training fails not because people don''t understand the concepts - but because they''ve never had to apply them under real conditions. Good training puts people in those conditions safely, with a facilitator who''s been in the room for real.",
    "principles": "Scenario-led from the first session\nFrameworks as tools, not religions\nCertification as a by-product of learning, not the goal\nEvery technique connected to a real business problem"
  },
  {
    "label": "Coaching",
    "heading": "Questions, not answers.",
    "body": "The best coaching conversations don''t end with a solution handed over. They end with the person finding their own clarity - which means they own it, and they''re more likely to act on it. My job is to ask the right questions, hold the space, and get out of the way.",
    "principles": "ICF-aligned approach throughout\nExperience in the room, but not imposing it\nThe coachee''s agenda, not mine\nHonest feedback when it''s asked for"
  }
]',
   'Philosophy cards', 'One card per side of what you do. Each has a short tag, a heading, a paragraph and a list of principles, one per line.')
on conflict (key) do nothing;

-- Check: three cards and two cards, with their headings.
select key,
       jsonb_array_length(value::jsonb) as how_many,
       jsonb_path_query_array(value::jsonb, '$[*].heading') as headings
  from public.site_copy
 where key in ('home.personas.items', 'about.philosophy.items')
 order by key;
