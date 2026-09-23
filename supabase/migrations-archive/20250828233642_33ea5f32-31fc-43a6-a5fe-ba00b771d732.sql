-- Link knowledge items to their correct categories based on staging data
UPDATE knowledge_items 
SET category_id = kc.id
FROM knowledge_categories kc, staging_data sd
WHERE knowledge_items.slug = lower(regexp_replace(sd.raw_data->>'Activity', '[^a-zA-Z0-9]+', '-', 'g'))
  AND kc.slug = lower(regexp_replace(sd.raw_data->>'Category', '[^a-zA-Z0-9]+', '-', 'g'))
  AND sd.processing_status = 'processed'
  AND sd.import_id = 'a65d9ece-5a56-4279-a1d9-d50ffcda8d1c';