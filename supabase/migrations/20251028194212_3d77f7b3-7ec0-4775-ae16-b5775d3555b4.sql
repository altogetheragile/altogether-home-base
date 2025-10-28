-- Add has_ai_support column to knowledge_items table
ALTER TABLE knowledge_items 
ADD COLUMN has_ai_support BOOLEAN DEFAULT false;

-- Update existing AI-enabled knowledge items
UPDATE knowledge_items 
SET has_ai_support = true 
WHERE slug IN ('business-model-canvas', 'product-backlog');

-- Add comment for documentation
COMMENT ON COLUMN knowledge_items.has_ai_support IS 'Indicates whether this knowledge item has AI-powered workspace support (e.g., BMC, User Stories)';