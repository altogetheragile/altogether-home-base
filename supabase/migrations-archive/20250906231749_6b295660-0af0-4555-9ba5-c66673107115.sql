-- Phase 1: Author & Publication System Normalization
-- Create authors table
CREATE TABLE public.authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  profile_image_url TEXT,
  website_url TEXT,
  expertise_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

-- Create publications table
CREATE TABLE public.publications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  publication_type TEXT NOT NULL CHECK (publication_type IN ('book', 'article', 'paper', 'website', 'blog', 'video', 'podcast', 'other')),
  url TEXT,
  isbn TEXT,
  doi TEXT,
  publication_year INTEGER,
  publisher TEXT,
  journal TEXT,
  volume TEXT,
  issue TEXT,
  pages TEXT,
  abstract TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users,
  updated_by UUID REFERENCES auth.users
);

-- Create author-publication many-to-many relationship
CREATE TABLE public.publication_authors (
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  author_order INTEGER DEFAULT 1,
  role TEXT DEFAULT 'author' CHECK (role IN ('author', 'co-author', 'editor', 'contributor')),
  PRIMARY KEY (publication_id, author_id)
);

-- Create knowledge item references table to replace evidence_sources array
CREATE TABLE public.knowledge_item_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL DEFAULT 'evidence' CHECK (reference_type IN ('primary', 'evidence', 'related', 'citation')),
  page_reference TEXT,
  excerpt TEXT,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add publication reference to knowledge_items (replaces author, reference_url, publication_year)
ALTER TABLE public.knowledge_items 
ADD COLUMN primary_publication_id UUID REFERENCES public.publications(id);

-- Enable RLS on new tables
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_item_references ENABLE ROW LEVEL SECURITY;

-- RLS policies for authors
CREATE POLICY "Public can view authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Admins can manage authors" ON public.authors FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for publications
CREATE POLICY "Public can view publications" ON public.publications FOR SELECT USING (true);
CREATE POLICY "Admins can manage publications" ON public.publications FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for publication_authors
CREATE POLICY "Public can view publication authors" ON public.publication_authors FOR SELECT USING (true);
CREATE POLICY "Admins can manage publication authors" ON public.publication_authors FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for knowledge_item_references
CREATE POLICY "Public can view references for published items" ON public.knowledge_item_references 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM knowledge_items ki 
    WHERE ki.id = knowledge_item_references.knowledge_item_id 
    AND ki.is_published = true
  )
);
CREATE POLICY "Admins can manage all references" ON public.knowledge_item_references FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_authors_name ON public.authors(name);
CREATE INDEX idx_publications_title ON public.publications(title);
CREATE INDEX idx_publications_type_year ON public.publications(publication_type, publication_year);
CREATE INDEX idx_publication_authors_publication ON public.publication_authors(publication_id);
CREATE INDEX idx_publication_authors_author ON public.publication_authors(author_id);
CREATE INDEX idx_knowledge_item_refs_item ON public.knowledge_item_references(knowledge_item_id);
CREATE INDEX idx_knowledge_item_refs_publication ON public.knowledge_item_references(publication_id);
CREATE INDEX idx_knowledge_items_primary_publication ON public.knowledge_items(primary_publication_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_authors_updated_at
  BEFORE UPDATE ON public.authors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON public.publications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_item_references_updated_at
  BEFORE UPDATE ON public.knowledge_item_references
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from knowledge_items
-- First, create authors from existing author field
INSERT INTO public.authors (name, created_at)
SELECT DISTINCT 
  ki.author,
  MIN(ki.created_at)
FROM public.knowledge_items ki
WHERE ki.author IS NOT NULL 
  AND ki.author != ''
GROUP BY ki.author;

-- Create publications from existing reference_url and publication_year
INSERT INTO public.publications (title, publication_type, url, publication_year, created_at)
SELECT DISTINCT
  COALESCE(ki.author || ' (' || ki.publication_year || ')', 'Unknown Publication'),
  CASE 
    WHEN ki.reference_url LIKE '%youtube%' OR ki.reference_url LIKE '%vimeo%' THEN 'video'
    WHEN ki.reference_url LIKE '%podcast%' OR ki.reference_url LIKE '%spotify%' THEN 'podcast'
    WHEN ki.reference_url LIKE '%.pdf' THEN 'paper'
    WHEN ki.reference_url IS NOT NULL AND ki.reference_url != '' THEN 'website'
    ELSE 'other'
  END,
  ki.reference_url,
  ki.publication_year,
  MIN(ki.created_at)
FROM public.knowledge_items ki
WHERE (ki.reference_url IS NOT NULL AND ki.reference_url != '') 
   OR (ki.author IS NOT NULL AND ki.author != '')
GROUP BY ki.author, ki.reference_url, ki.publication_year;

-- Link knowledge items to their primary publications
UPDATE public.knowledge_items 
SET primary_publication_id = p.id
FROM public.publications p
WHERE (knowledge_items.reference_url = p.url OR 
       (knowledge_items.reference_url IS NULL AND p.url IS NULL))
  AND (knowledge_items.publication_year = p.publication_year OR 
       (knowledge_items.publication_year IS NULL AND p.publication_year IS NULL))
  AND p.title LIKE knowledge_items.author || '%';

-- Link publications to authors
INSERT INTO public.publication_authors (publication_id, author_id, author_order)
SELECT DISTINCT p.id, a.id, 1
FROM public.publications p
JOIN public.authors a ON p.title LIKE a.name || '%'
WHERE NOT EXISTS (
  SELECT 1 FROM public.publication_authors pa 
  WHERE pa.publication_id = p.id AND pa.author_id = a.id
);