-- Create user profiles and personalization tables

-- User reading progress tracking
CREATE TABLE public.user_reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technique_id UUID NOT NULL REFERENCES knowledge_techniques(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'reading', 'read', 'applied', 'mastered')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, technique_id)
);

-- User bookmarks
CREATE TABLE public.user_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  technique_id UUID NOT NULL REFERENCES knowledge_techniques(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, technique_id)
);

-- User preferences
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_difficulty_levels TEXT[],
  preferred_categories UUID[],
  preferred_tags UUID[],
  notification_settings JSONB DEFAULT '{"email": true, "push": false, "in_app": true}'::jsonb,
  display_preferences JSONB DEFAULT '{"theme": "system", "density": "normal", "language": "en"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Learning paths
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Learning path steps
CREATE TABLE public.learning_path_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  technique_id UUID NOT NULL REFERENCES knowledge_techniques(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  description TEXT,
  estimated_minutes INTEGER DEFAULT 15,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User learning path progress
CREATE TABLE public.user_learning_path_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES learning_path_steps(id),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, path_id)
);

-- Technique comments
CREATE TABLE public.technique_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id UUID NOT NULL REFERENCES knowledge_techniques(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES technique_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comment votes
CREATE TABLE public.comment_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES technique_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- User contributed examples
CREATE TABLE public.user_contributed_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id UUID NOT NULL REFERENCES knowledge_techniques(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  context TEXT,
  outcome TEXT,
  industry TEXT,
  company_size TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technique_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_contributed_examples ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User reading progress policies
CREATE POLICY "Users can manage own reading progress" ON public.user_reading_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reading progress" ON public.user_reading_progress
  FOR SELECT USING (is_admin());

-- User bookmarks policies
CREATE POLICY "Users can manage own bookmarks" ON public.user_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Learning paths policies
CREATE POLICY "Public can view published learning paths" ON public.learning_paths
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all learning paths" ON public.learning_paths
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Learning path steps policies
CREATE POLICY "Public can view steps of published paths" ON public.learning_path_steps
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM learning_paths p 
    WHERE p.id = path_id AND p.is_published = true
  ));

CREATE POLICY "Admins can manage learning path steps" ON public.learning_path_steps
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- User learning path progress policies
CREATE POLICY "Users can manage own learning path progress" ON public.user_learning_path_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Technique comments policies
CREATE POLICY "Anyone can view approved comments" ON public.technique_comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create comments" ON public.technique_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments" ON public.technique_comments
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON public.technique_comments
  FOR ALL USING (is_admin());

-- Comment votes policies
CREATE POLICY "Users can manage own votes" ON public.comment_votes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON public.comment_votes
  FOR SELECT USING (true);

-- User contributed examples policies
CREATE POLICY "Users can submit examples" ON public.user_contributed_examples
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view own submissions" ON public.user_contributed_examples
  FOR SELECT USING (auth.uid() = submitted_by);

CREATE POLICY "Anyone can view approved examples" ON public.user_contributed_examples
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Admins can manage all contributed examples" ON public.user_contributed_examples
  FOR ALL USING (is_admin());

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_user_reading_progress_updated_at
  BEFORE UPDATE ON public.user_reading_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_learning_path_progress_updated_at
  BEFORE UPDATE ON public.user_learning_path_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_technique_comments_updated_at
  BEFORE UPDATE ON public.technique_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_contributed_examples_updated_at
  BEFORE UPDATE ON public.user_contributed_examples
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();