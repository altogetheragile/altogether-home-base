-- A badge is a picture, chosen with a picture box.
--
-- about.badges.list was "name | image address | link", one per line, so the only picture on the
-- About page that could not be chosen from the picture library was one you had to know the file
-- address of. It is a list of rows now, each with its own picture box, like every other list.
--
-- The page still reads the old shape, so nothing breaks on a database this has not reached yet.
-- The editor does not: it would show the old text as an empty list, and saving that would lose
-- the badges. So every saved value is converted here, in place.
--
-- Safe to run twice: a value already starting with "[" is left alone. A line without all three
-- parts was skipped by the page, and is skipped here for the same reason.

update public.site_copy c
   set value = coalesce((
         select jsonb_pretty(jsonb_agg(
                  jsonb_build_object(
                    'name',  trim(parts[1]),
                    'image', trim(parts[2]),
                    'link',  trim(parts[3]))
                  order by n))
           from (
             select string_to_array(line, '|') as parts, n
               from unnest(string_to_array(c.value, E'\n')) with ordinality as l(line, n)
           ) lines
          where array_length(parts, 1) = 3
            and trim(parts[1]) <> '' and trim(parts[2]) <> '' and trim(parts[3]) <> ''
       ), '')
 where c.key = 'about.badges.list'
   and trim(c.value) <> ''
   and ltrim(c.value) not like '[%';
