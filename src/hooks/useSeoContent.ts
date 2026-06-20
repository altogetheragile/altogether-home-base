import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SeoKind = 'exam' | 'course' | 'blog';
export type SeoTable = 'exams' | 'event_templates';

export interface SeoItem {
  kind: SeoKind;
  id: string;
  table: SeoTable | 'blog_posts';
  label: string;
  url: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  editableHere: boolean; // exams/courses edited here; blog edited in the Blog section
  published: boolean;
}

/** All indexable, content-managed pages (exams, courses, blog) with their SEO meta. */
export function useSeoContent() {
  return useQuery({
    queryKey: ['seo-content'],
    queryFn: async (): Promise<SeoItem[]> => {
      const [exams, courses, blog] = await Promise.all([
        supabase.from('exams').select('id, slug, title, description, seo_title, seo_description, status'),
        supabase.from('event_templates').select('id, title, description, short_description, seo_title, seo_description, is_published'),
        supabase.from('blog_posts').select('id, slug, title, seo_title, seo_description, is_published'),
      ]);
      if (exams.error) throw exams.error;
      if (courses.error) throw courses.error;
      if (blog.error) throw blog.error;

      const items: SeoItem[] = [];
      for (const e of exams.data || []) {
        items.push({
          kind: 'exam', id: e.id, table: 'exams', label: e.title, url: `/exams/${e.slug}`,
          description: e.description, seoTitle: e.seo_title, seoDescription: e.seo_description,
          editableHere: true, published: e.status === 'published',
        });
      }
      for (const c of courses.data || []) {
        items.push({
          kind: 'course', id: c.id, table: 'event_templates', label: c.title, url: `/courses/${c.id}`,
          description: c.description || c.short_description, seoTitle: c.seo_title, seoDescription: c.seo_description,
          editableHere: true, published: !!c.is_published,
        });
      }
      for (const b of blog.data || []) {
        items.push({
          kind: 'blog', id: b.id, table: 'blog_posts', label: b.title, url: `/blog/${b.slug}`,
          description: null, seoTitle: b.seo_title, seoDescription: b.seo_description,
          editableHere: false, published: !!b.is_published,
        });
      }
      return items;
    },
  });
}

/** Save SEO title/description overrides for an exam or course. */
export function useUpdateSeo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { table: SeoTable; id: string; seoTitle: string; seoDescription: string }) => {
      const { error } = await supabase
        .from(input.table)
        .update({ seo_title: input.seoTitle || null, seo_description: input.seoDescription || null })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-content'] });
      toast({ title: 'SEO saved', description: 'Live on the next deploy / prerender.' });
    },
    onError: (err: unknown) => {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    },
  });
}

/** Classify a page's meta description quality (Google shows ~155-160 chars). */
export function metaDescriptionStatus(item: SeoItem): { label: string; tone: 'good' | 'warn' | 'bad'; length: number } {
  const desc = (item.seoDescription || item.description || '').trim();
  const length = desc.length;
  if (length === 0) return { label: 'Missing', tone: 'bad', length };
  if (length < 70) return { label: 'Too short', tone: 'warn', length };
  if (length > 160) return { label: 'Too long', tone: 'warn', length };
  return { label: 'Good', tone: 'good', length };
}
