-- Update all existing knowledge item elements in canvases to add missing fields
UPDATE canvases 
SET data = jsonb_set(
  data,
  '{elements}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'type' = 'knowledgeItem' THEN
          elem ||
          jsonb_build_object(
            'content', 
            (elem->'content') || 
            jsonb_build_object(
              'openAsTab', false,
              'hasAISupport', COALESCE((elem->'content'->>'hasAISupport')::boolean, false)
            )
          )
        ELSE elem
      END
    )
    FROM jsonb_array_elements(data->'elements') elem
  )
)
WHERE canvas_type = 'project' 
AND data->'elements' IS NOT NULL;