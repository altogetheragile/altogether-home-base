-- Fix hasAISupport values for BMC and User Stories hexis
UPDATE canvases 
SET data = jsonb_set(
  data,
  '{elements}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'type' = 'knowledgeItem' AND 
             elem->'content'->>'slug' IN ('business-model-canvas', 'product-backlog') 
        THEN
          elem ||
          jsonb_build_object(
            'content', 
            (elem->'content') || 
            jsonb_build_object('hasAISupport', true)
          )
        ELSE elem
      END
    )
    FROM jsonb_array_elements(data->'elements') elem
  )
)
WHERE canvas_type = 'project' 
AND data->'elements' IS NOT NULL;