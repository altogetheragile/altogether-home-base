-- Add display_order column to knowledge_categories table
ALTER TABLE knowledge_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing records with sequential display_order based on name
WITH numbered_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
  FROM knowledge_categories
)
UPDATE knowledge_categories
SET display_order = nc.row_num
FROM numbered_categories nc
WHERE knowledge_categories.id = nc.id AND knowledge_categories.display_order = 0;