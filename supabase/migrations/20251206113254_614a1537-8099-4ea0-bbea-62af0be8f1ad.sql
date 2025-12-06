-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create backlog_items table
CREATE TABLE public.backlog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'idea',
  backlog_position INTEGER DEFAULT 0,
  estimated_value INTEGER,
  estimated_effort INTEGER,
  source TEXT,
  target_release TEXT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Backlog items policies
CREATE POLICY "Admins can manage all backlog items" ON public.backlog_items
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view backlog items" ON public.backlog_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create backlog items" ON public.backlog_items
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own backlog items" ON public.backlog_items
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own backlog items" ON public.backlog_items
  FOR DELETE USING (auth.uid() = created_by);

-- Add indexes for performance
CREATE INDEX idx_backlog_items_product_id ON public.backlog_items(product_id);
CREATE INDEX idx_backlog_items_position ON public.backlog_items(backlog_position);
CREATE INDEX idx_backlog_items_status ON public.backlog_items(status);
CREATE INDEX idx_products_slug ON public.products(slug);

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backlog_items_updated_at
  BEFORE UPDATE ON public.backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();