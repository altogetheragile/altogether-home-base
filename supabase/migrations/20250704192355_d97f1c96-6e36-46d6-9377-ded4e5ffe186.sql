-- Event Enhancement Schema Migration
-- Add new columns to events table for comprehensive event management

-- Add new columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS capacity integer,
ADD COLUMN IF NOT EXISTS registration_deadline date,
ADD COLUMN IF NOT EXISTS time_zone text,
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS venue_details text,
ADD COLUMN IF NOT EXISTS daily_schedule text,
ADD COLUMN IF NOT EXISTS banner_image_url text,
ADD COLUMN IF NOT EXISTS seo_slug text,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS internal_notes text,
ADD COLUMN IF NOT EXISTS course_code text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS expected_revenue_cents integer,
ADD COLUMN IF NOT EXISTS lead_source text,
ADD COLUMN IF NOT EXISTS event_type_id uuid,
ADD COLUMN IF NOT EXISTS category_id uuid,
ADD COLUMN IF NOT EXISTS level_id uuid,
ADD COLUMN IF NOT EXISTS format_id uuid;

-- Add foreign key constraints (drop first if they exist to avoid conflicts)
DO $$ 
BEGIN
    -- Drop constraints if they exist
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS fk_events_event_type_id;
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS fk_events_category_id;
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS fk_events_level_id;
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS fk_events_format_id;
    
    -- Add the constraints
    ALTER TABLE public.events ADD CONSTRAINT fk_events_event_type_id 
    FOREIGN KEY (event_type_id) REFERENCES public.event_types(id);
    
    ALTER TABLE public.events ADD CONSTRAINT fk_events_category_id 
    FOREIGN KEY (category_id) REFERENCES public.event_categories(id);
    
    ALTER TABLE public.events ADD CONSTRAINT fk_events_level_id 
    FOREIGN KEY (level_id) REFERENCES public.levels(id);
    
    ALTER TABLE public.events ADD CONSTRAINT fk_events_format_id 
    FOREIGN KEY (format_id) REFERENCES public.formats(id);

    -- Add check constraint for status values
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS chk_events_status;
    ALTER TABLE public.events ADD CONSTRAINT chk_events_status 
    CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled'));
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON public.events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON public.events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_level_id ON public.events(level_id);
CREATE INDEX IF NOT EXISTS idx_events_format_id ON public.events(format_id);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_events_seo_slug ON public.events(seo_slug);

-- Update existing events to have default status
UPDATE public.events SET status = 'draft' WHERE status IS NULL;