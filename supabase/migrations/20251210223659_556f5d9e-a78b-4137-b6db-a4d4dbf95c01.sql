-- Add display_order column to project_artifacts
ALTER TABLE project_artifacts 
ADD COLUMN display_order integer DEFAULT 0;

-- Set initial order based on created_at within each type
UPDATE project_artifacts 
SET display_order = subquery.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id, artifact_type ORDER BY created_at) as row_num 
  FROM project_artifacts
) AS subquery 
WHERE project_artifacts.id = subquery.id;