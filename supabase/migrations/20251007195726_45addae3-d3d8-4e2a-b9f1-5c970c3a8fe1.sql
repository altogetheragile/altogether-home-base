
-- Create knowledge_item_likes table
CREATE TABLE public.knowledge_item_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(knowledge_item_id, user_id)
);

-- Create knowledge_item_comments table
CREATE TABLE public.knowledge_item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_knowledge_item_likes_item ON public.knowledge_item_likes(knowledge_item_id);
CREATE INDEX idx_knowledge_item_likes_user ON public.knowledge_item_likes(user_id);
CREATE INDEX idx_knowledge_item_comments_item ON public.knowledge_item_comments(knowledge_item_id);
CREATE INDEX idx_knowledge_item_comments_user ON public.knowledge_item_comments(user_id);

-- Enable RLS
ALTER TABLE public.knowledge_item_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_item_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Anyone can view likes"
  ON public.knowledge_item_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add likes"
  ON public.knowledge_item_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.knowledge_item_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
  ON public.knowledge_item_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON public.knowledge_item_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.knowledge_item_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.knowledge_item_comments
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
  ON public.knowledge_item_comments
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger for updating updated_at on comments
CREATE TRIGGER update_knowledge_item_comments_updated_at
  BEFORE UPDATE ON public.knowledge_item_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
