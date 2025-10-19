-- Phase 1: Database Schema Enhancement
-- Add rich metadata columns to user_stories, epics, and features tables

-- =====================================================
-- USER STORIES TABLE ENHANCEMENTS
-- =====================================================

-- Context fields
ALTER TABLE public.user_stories 
  ADD COLUMN IF NOT EXISTS user_persona TEXT,
  ADD COLUMN IF NOT EXISTS problem_statement TEXT,
  ADD COLUMN IF NOT EXISTS business_value TEXT,
  ADD COLUMN IF NOT EXISTS assumptions_risks TEXT,
  ADD COLUMN IF NOT EXISTS dependencies TEXT[];

-- Implementation fields
ALTER TABLE public.user_stories 
  ADD COLUMN IF NOT EXISTS technical_notes TEXT,
  ADD COLUMN IF NOT EXISTS design_notes TEXT,
  ADD COLUMN IF NOT EXISTS ui_mockup_url TEXT;

-- Checklist fields (stored as JSONB for flexibility)
-- Example structure: {"items": [{"label": "AC defined", "checked": true}]}
ALTER TABLE public.user_stories 
  ADD COLUMN IF NOT EXISTS definition_of_ready JSONB DEFAULT '{"items": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS definition_of_done JSONB DEFAULT '{"items": []}'::jsonb;

-- Metadata fields
ALTER TABLE public.user_stories 
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS story_type TEXT DEFAULT 'feature' 
    CHECK (story_type IN ('feature', 'spike', 'bug', 'chore', 'task')),
  ADD COLUMN IF NOT EXISTS sprint TEXT,
  ADD COLUMN IF NOT EXISTS impact_effort_matrix JSONB,
  ADD COLUMN IF NOT EXISTS evidence_links TEXT[],
  ADD COLUMN IF NOT EXISTS non_functional_requirements TEXT[],
  ADD COLUMN IF NOT EXISTS customer_journey_stage TEXT,
  ADD COLUMN IF NOT EXISTS confidence_level INTEGER 
    CHECK (confidence_level IS NULL OR (confidence_level BETWEEN 1 AND 5));

-- =====================================================
-- EPICS TABLE ENHANCEMENTS
-- =====================================================

ALTER TABLE public.epics 
  ADD COLUMN IF NOT EXISTS business_objective TEXT,
  ADD COLUMN IF NOT EXISTS success_metrics TEXT[],
  ADD COLUMN IF NOT EXISTS stakeholders TEXT[],
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS target_date DATE;

-- =====================================================
-- FEATURES TABLE ENHANCEMENTS
-- =====================================================

ALTER TABLE public.features 
  ADD COLUMN IF NOT EXISTS user_value TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT[],
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft', 'in_progress', 'completed', 'blocked', 'cancelled'));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_user_stories_tags ON public.user_stories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_stories_story_type ON public.user_stories(story_type);
CREATE INDEX IF NOT EXISTS idx_user_stories_sprint ON public.user_stories(sprint);
CREATE INDEX IF NOT EXISTS idx_user_stories_confidence_level ON public.user_stories(confidence_level);
CREATE INDEX IF NOT EXISTS idx_features_status ON public.features(status);
CREATE INDEX IF NOT EXISTS idx_epics_start_date ON public.epics(start_date);
CREATE INDEX IF NOT EXISTS idx_epics_target_date ON public.epics(target_date);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.user_stories.user_persona IS 'Target user type or persona for this story';
COMMENT ON COLUMN public.user_stories.problem_statement IS 'The problem this story aims to solve';
COMMENT ON COLUMN public.user_stories.business_value IS 'Business impact and value proposition';
COMMENT ON COLUMN public.user_stories.definition_of_ready IS 'Checklist items for story readiness (JSONB format)';
COMMENT ON COLUMN public.user_stories.definition_of_done IS 'Checklist items for completion criteria (JSONB format)';
COMMENT ON COLUMN public.user_stories.story_type IS 'Type of story: feature, spike, bug, chore, or task';
COMMENT ON COLUMN public.user_stories.impact_effort_matrix IS 'Impact and effort estimation (JSONB format: {"impact": "high", "effort": "medium"})';
COMMENT ON COLUMN public.user_stories.confidence_level IS 'Confidence level from 1 (low) to 5 (high)';

COMMENT ON COLUMN public.epics.business_objective IS 'High-level business goal for this epic';
COMMENT ON COLUMN public.epics.success_metrics IS 'Measurable success criteria';
COMMENT ON COLUMN public.epics.stakeholders IS 'Key stakeholders involved';

COMMENT ON COLUMN public.features.user_value IS 'Value proposition for the user';
COMMENT ON COLUMN public.features.acceptance_criteria IS 'List of acceptance criteria';
COMMENT ON COLUMN public.features.status IS 'Current status: draft, in_progress, completed, blocked, or cancelled';