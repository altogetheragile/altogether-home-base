-- Phase 2: Rate Limiting Function (1 comment per 30 seconds)
CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM public.knowledge_item_comments
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '30 seconds'
  ) THEN
    RAISE EXCEPTION 'You are posting too quickly. Please wait 30 seconds between comments.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phase 2: Duplicate Detection Function (within 24 hours)
CREATE OR REPLACE FUNCTION public.check_duplicate_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM public.knowledge_item_comments
    WHERE user_id = NEW.user_id
      AND knowledge_item_id = NEW.knowledge_item_id
      AND content = NEW.content
      AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'You have already posted this comment. Please avoid duplicate submissions.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phase 2: Add content length constraint
ALTER TABLE public.knowledge_item_comments 
ADD CONSTRAINT comment_content_length 
CHECK (length(content) >= 3 AND length(content) <= 2000);

-- Phase 2: Create triggers for rate limiting and duplicate detection
CREATE TRIGGER enforce_comment_rate_limit
  BEFORE INSERT ON public.knowledge_item_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_comment_rate_limit();

CREATE TRIGGER enforce_duplicate_check
  BEFORE INSERT ON public.knowledge_item_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_comment();

-- Phase 3: Comment Reports Table
CREATE TABLE public.comment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.knowledge_item_comments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'off-topic', 'harassment', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on comment_reports
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can report comments" ON public.comment_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.comment_reports
  FOR SELECT
  USING (auth.uid() = reported_by);

-- Admins can manage all reports
CREATE POLICY "Admins can manage all reports" ON public.comment_reports
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Phase 3: User Reputation Table
CREATE TABLE public.user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_comments INTEGER NOT NULL DEFAULT 0,
  reports_received INTEGER NOT NULL DEFAULT 0,
  reports_dismissed INTEGER NOT NULL DEFAULT 0,
  admin_warnings INTEGER NOT NULL DEFAULT 0,
  trust_level TEXT NOT NULL DEFAULT 'new' CHECK (trust_level IN ('new', 'established', 'trusted', 'restricted')),
  last_comment_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_reputation
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- Users can view their own reputation
CREATE POLICY "Users can view own reputation" ON public.user_reputation
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all reputation
CREATE POLICY "Admins can manage all reputation" ON public.user_reputation
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Function to update user reputation after comment
CREATE OR REPLACE FUNCTION public.update_user_reputation_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_reputation (user_id, total_comments, last_comment_at)
  VALUES (NEW.user_id, 1, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_comments = user_reputation.total_comments + 1,
    last_comment_at = NOW(),
    updated_at = NOW(),
    trust_level = CASE
      WHEN user_reputation.total_comments >= 100 AND user_reputation.reports_received = 0 THEN 'trusted'
      WHEN user_reputation.total_comments >= 10 AND (EXTRACT(EPOCH FROM (NOW() - user_reputation.created_at)) / 86400) >= 30 THEN 'established'
      WHEN user_reputation.reports_received > 3 THEN 'restricted'
      ELSE user_reputation.trust_level
    END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update reputation after comment
CREATE TRIGGER update_reputation_after_comment
  AFTER INSERT ON public.knowledge_item_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_reputation_on_comment();

-- Function to update reputation after report
CREATE OR REPLACE FUNCTION public.update_user_reputation_on_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the user_id of the comment owner
  UPDATE public.user_reputation
  SET 
    reports_received = reports_received + 1,
    updated_at = NOW(),
    trust_level = CASE
      WHEN reports_received + 1 > 3 THEN 'restricted'
      ELSE trust_level
    END
  WHERE user_id = (
    SELECT user_id FROM public.knowledge_item_comments WHERE id = NEW.comment_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update reputation after report
CREATE TRIGGER update_reputation_after_report
  AFTER INSERT ON public.comment_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_reputation_on_report();

-- Create index for better performance
CREATE INDEX idx_comment_reports_status ON public.comment_reports(status);
CREATE INDEX idx_comment_reports_comment_id ON public.comment_reports(comment_id);
CREATE INDEX idx_user_reputation_trust_level ON public.user_reputation(trust_level);