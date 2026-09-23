
-- Add created_by and updated_by columns for audit trail
ALTER TABLE locations 
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN updated_by uuid REFERENCES auth.users(id);

ALTER TABLE instructors 
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN updated_by uuid REFERENCES auth.users(id);

ALTER TABLE events 
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN updated_by uuid REFERENCES auth.users(id);

ALTER TABLE event_templates 
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Update RLS policies to include created_by in insert checks
DROP POLICY IF EXISTS "Admins can insert locations" ON locations;
CREATE POLICY "Admins can insert locations" 
ON locations FOR INSERT 
TO authenticated 
WITH CHECK (is_admin() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can insert instructors" ON instructors;
CREATE POLICY "Admins can insert instructors" 
ON instructors FOR INSERT 
TO authenticated 
WITH CHECK (is_admin() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events" 
ON events FOR INSERT 
TO authenticated 
WITH CHECK (is_admin() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can insert event_templates" ON event_templates;
CREATE POLICY "Admins can insert event_templates" 
ON event_templates FOR INSERT 
TO authenticated 
WITH CHECK (is_admin() AND auth.uid() = created_by);
