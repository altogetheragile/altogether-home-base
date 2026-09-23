-- Add testimonial display settings to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS show_testimonial_name boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_testimonial_company boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_testimonial_rating_header boolean DEFAULT true;