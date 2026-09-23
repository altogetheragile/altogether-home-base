-- Create user stories table
CREATE TABLE public.user_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT[],
  story_points INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'in_progress', 'testing', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  issue_type TEXT DEFAULT 'story' CHECK (issue_type IN ('epic', 'story', 'task', 'bug')),
  epic_id UUID,
  feature_id UUID,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  jira_issue_key TEXT,
  position INTEGER DEFAULT 0
);

-- Create epics table
CREATE TABLE public.epics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  jira_issue_key TEXT,
  position INTEGER DEFAULT 0
);

-- Create features table
CREATE TABLE public.features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  epic_id UUID,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  jira_issue_key TEXT,
  position INTEGER DEFAULT 0
);

-- Create story relationships table
CREATE TABLE public.story_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_story_id UUID NOT NULL,
  target_story_id UUID NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('blocks', 'depends_on', 'relates_to', 'duplicates')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for user stories
CREATE POLICY "Admins can manage all user stories" ON public.user_stories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view published user stories" ON public.user_stories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create user stories" ON public.user_stories
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own user stories" ON public.user_stories
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Create policies for epics
CREATE POLICY "Admins can manage all epics" ON public.epics
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view epics" ON public.epics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create epics" ON public.epics
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own epics" ON public.epics
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Create policies for features
CREATE POLICY "Admins can manage all features" ON public.features
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view features" ON public.features
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create features" ON public.features
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own features" ON public.features
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Create policies for story relationships
CREATE POLICY "Admins can manage all story relationships" ON public.story_relationships
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view story relationships" ON public.story_relationships
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create story relationships" ON public.story_relationships
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create foreign key constraints
ALTER TABLE public.user_stories ADD CONSTRAINT fk_user_stories_epic 
  FOREIGN KEY (epic_id) REFERENCES public.epics(id) ON DELETE SET NULL;

ALTER TABLE public.user_stories ADD CONSTRAINT fk_user_stories_feature 
  FOREIGN KEY (feature_id) REFERENCES public.features(id) ON DELETE SET NULL;

ALTER TABLE public.features ADD CONSTRAINT fk_features_epic 
  FOREIGN KEY (epic_id) REFERENCES public.epics(id) ON DELETE CASCADE;

ALTER TABLE public.story_relationships ADD CONSTRAINT fk_story_relationships_source 
  FOREIGN KEY (source_story_id) REFERENCES public.user_stories(id) ON DELETE CASCADE;

ALTER TABLE public.story_relationships ADD CONSTRAINT fk_story_relationships_target 
  FOREIGN KEY (target_story_id) REFERENCES public.user_stories(id) ON DELETE CASCADE;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_stories_updated_at
  BEFORE UPDATE ON public.user_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epics_updated_at
  BEFORE UPDATE ON public.epics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_stories_epic_id ON public.user_stories(epic_id);
CREATE INDEX idx_user_stories_feature_id ON public.user_stories(feature_id);
CREATE INDEX idx_user_stories_status ON public.user_stories(status);
CREATE INDEX idx_features_epic_id ON public.features(epic_id);
CREATE INDEX idx_story_relationships_source ON public.story_relationships(source_story_id);
CREATE INDEX idx_story_relationships_target ON public.story_relationships(target_story_id);