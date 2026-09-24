-- Move this site's statistics from eight numbered rows into one list.
--
-- SAFE TO RUN BEFORE THE MERGE, AND THAT IS THE POINT. Adding home.stats.items changes nothing
-- while the deployed code still reads the numbered keys, so the order is: run this, then merge,
-- then the new code finds the row already waiting for it. Expand, migrate, contract.
--
-- The eight old rows are deliberately left alone. Nothing reads them once the new code is live,
-- and leaving them means this is reversible by simply not deploying. Delete them later, once the
-- statistics bar has been seen working.

insert into public.site_copy (key, page, value, label, hint)
values (
  'home.stats.items', 'home',
  '[
  {
    "number": "1,500+",
    "label": "Practitioners trained"
  },
  {
    "number": "80+",
    "label": "Agile techniques"
  },
  {
    "number": "12+",
    "label": "Frameworks covered"
  },
  {
    "number": "4.9\u2605",
    "label": "Average rating"
  }
]',
  'Statistics',
  'The bar under the hero. Add as many or as few as you like; leave it empty and the bar does not appear.'
)
on conflict (key) do nothing;

-- Check: four statistics, in the order they appear on the page today.
select jsonb_array_length(value::jsonb) as how_many,
       jsonb_path_query_array(value::jsonb, '$[*].number') as figures
  from public.site_copy where key = 'home.stats.items';
