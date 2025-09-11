UPDATE content_blocks 
SET content = jsonb_set(content, '{styles}', '{}')
WHERE id = '89332d9b-68c6-44d5-88a5-0c1f73eecf31' AND content->'styles' IS NULL;