-- Add full_description column to activity_domains table
ALTER TABLE activity_domains 
ADD COLUMN IF NOT EXISTS full_description TEXT;