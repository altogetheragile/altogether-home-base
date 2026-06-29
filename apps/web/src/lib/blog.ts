import { marked } from 'marked';
import { createClient } from '@/lib/supabase/server';

export type BlogCategory = { name: string; slug: string; color: string | null };
export type BlogPostRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  estimated_reading_time: number | null;
  blog_categories: BlogCategory | null;
};

const FIELDS =
  'slug, title, excerpt, content, featured_image_url, published_at, updated_at, seo_title, seo_description, estimated_reading_time, blog_categories(name, slug, color)';

export async function getPosts(): Promise<BlogPostRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('blog_posts')
      .select(FIELDS)
      .eq('is_published', true)
      .order('published_at', { ascending: false, nullsFirst: false });
    return (data as unknown as BlogPostRow[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<BlogPostRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('blog_posts')
      .select(FIELDS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();
    return (data as unknown as BlogPostRow) ?? null;
  } catch {
    return null;
  }
}

const isHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

/** Render stored post content (HTML or markdown) to HTML, scripts and inline
 *  event handlers stripped (content is authored by us, not user input). */
export function renderArticle(content: string | null): string {
  if (!content) return '';
  const html = isHtml(content) ? content : String(marked.parse(content, { async: false }));
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}

export { formatDate } from '@/lib/format';
