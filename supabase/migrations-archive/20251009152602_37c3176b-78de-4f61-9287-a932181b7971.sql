-- Swap display order of Categories and Planning Focuses tabs
UPDATE classification_config
SET display_order = CASE 
  WHEN classification_type = 'categories' THEN 1
  WHEN classification_type = 'planning-focuses' THEN 0
  ELSE display_order
END
WHERE classification_type IN ('categories', 'planning-focuses');