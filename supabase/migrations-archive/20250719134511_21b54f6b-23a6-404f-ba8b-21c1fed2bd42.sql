-- Create blog categories table
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog tags table
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  author_id UUID,
  category_id UUID REFERENCES blog_categories(id),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  estimated_reading_time INTEGER DEFAULT 5,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create blog post tags junction table
CREATE TABLE blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Enable RLS on all tables
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_categories
CREATE POLICY "Public can view blog categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog categories" ON blog_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for blog_tags
CREATE POLICY "Public can view blog tags" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog tags" ON blog_tags
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for blog_posts
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all blog posts" ON blog_posts
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for blog_post_tags
CREATE POLICY "Public can view blog post tags" ON blog_post_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog post tags" ON blog_post_tags
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update tag usage count
CREATE OR REPLACE FUNCTION update_blog_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM blog_post_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM blog_post_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tag usage count
CREATE TRIGGER update_blog_tag_usage_count_trigger
  AFTER INSERT OR DELETE ON blog_post_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_tag_usage_count();

-- Create function to increment blog post view count
CREATE OR REPLACE FUNCTION increment_blog_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$;