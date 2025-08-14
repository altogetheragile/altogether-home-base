-- Add user preferences table for personalized recommendations
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preferred_difficulty_level TEXT,
  preferred_categories TEXT[],
  preferred_formats TEXT[],
  learning_goals TEXT[],
  interaction_score JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add recommendations cache table
CREATE TABLE public.recommendation_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  score DECIMAL(5,4) NOT NULL DEFAULT 0,
  recommendation_type TEXT NOT NULL,
  context_data JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations" 
ON public.recommendation_cache 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage recommendations" 
ON public.recommendation_cache 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_recommendation_cache_user_content ON public.recommendation_cache(user_id, content_type, expires_at);
CREATE INDEX idx_recommendation_cache_content ON public.recommendation_cache(content_type, content_id);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();