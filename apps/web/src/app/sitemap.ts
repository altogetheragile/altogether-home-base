import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';

// The sitemap is generated from the routes and live data - one source of truth,
// so an orphan URL (the /courses class of bug) cannot happen here.
export const dynamic = 'force-dynamic';

const STATIC_PATHS = ['/', '/about', '/coaching', '/events', '/exams', '/blog'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE_URL}${p === '/' ? '' : p}`,
    changeFrequency: 'weekly',
  }));

  try {
    const supabase = createClient();
    const [{ data: exams }, { data: posts }] = await Promise.all([
      supabase.from('exams').select('slug, updated_at').eq('status', 'published'),
      supabase.from('blog_posts').select('slug, updated_at').eq('is_published', true),
    ]);
    for (const e of exams ?? []) {
      entries.push({ url: `${SITE_URL}/exams/${e.slug}`, lastModified: e.updated_at ?? undefined });
    }
    for (const p of posts ?? []) {
      entries.push({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updated_at ?? undefined });
    }
  } catch {
    // No DB connection at generation time: ship the static routes only.
  }

  return entries;
}
