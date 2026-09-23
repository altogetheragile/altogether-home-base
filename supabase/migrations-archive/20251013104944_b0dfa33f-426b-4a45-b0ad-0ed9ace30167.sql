-- Create course_feedback table for storing event and course testimonials
CREATE TABLE IF NOT EXISTS public.course_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  comment TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  source TEXT NOT NULL DEFAULT 'post_event',
  source_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.course_feedback ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_course_feedback_event_id ON public.course_feedback(event_id);
CREATE INDEX idx_course_feedback_is_approved ON public.course_feedback(is_approved);
CREATE INDEX idx_course_feedback_is_featured ON public.course_feedback(is_featured);
CREATE INDEX idx_course_feedback_rating ON public.course_feedback(rating);
CREATE INDEX idx_course_feedback_submitted_at ON public.course_feedback(submitted_at DESC);
CREATE INDEX idx_course_feedback_course_name ON public.course_feedback(course_name);

-- RLS Policies
CREATE POLICY "Public can view approved feedback"
  ON public.course_feedback
  FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Admins can manage all feedback"
  ON public.course_feedback
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can submit feedback"
  ON public.course_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_course_feedback_updated_at
  BEFORE UPDATE ON public.course_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();