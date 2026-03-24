import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.altogetheragile.com';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: string | null): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/events', priority: '0.9', changefreq: 'daily' },
      { url: '/knowledge', priority: '0.8', changefreq: 'weekly' },
      { url: '/coaching', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog', priority: '0.8', changefreq: 'weekly' },
      { url: '/exams', priority: '0.8', changefreq: 'weekly' },
      { url: '/about', priority: '0.7', changefreq: 'monthly' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      { url: '/testimonials', priority: '0.5', changefreq: 'monthly' },
      { url: '/ai-tools', priority: '0.5', changefreq: 'monthly' },
    ];

    // Fetch published blog posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    // Fetch published event templates (courses)
    const { data: templates } = await supabase
      .from('event_templates')
      .select('id, updated_at')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    // Fetch knowledge items
    const { data: techniques } = await supabase
      .from('knowledge_items')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('name');

    // Fetch published exams
    const { data: exams } = await supabase
      .from('exams')
      .select('id, updated_at')
      .eq('is_published', true)
      .order('title');

    // Fetch published CMS pages (excluding those already in static list)
    const { data: cmsPages } = await supabase
      .from('pages')
      .select('slug, updated_at')
      .eq('is_published', true)
      .eq('show_in_main_menu', true);

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Blog posts
    if (posts) {
      for (const post of posts) {
        xml += `  <url>
    <loc>${SITE_URL}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${formatDate(post.updated_at || post.published_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    // Course templates
    if (templates) {
      for (const t of templates) {
        xml += `  <url>
    <loc>${SITE_URL}/courses/${escapeXml(t.id)}</loc>
    <lastmod>${formatDate(t.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Knowledge base techniques
    if (techniques) {
      for (const t of techniques) {
        xml += `  <url>
    <loc>${SITE_URL}/knowledge/${escapeXml(t.slug)}</loc>
    <lastmod>${formatDate(t.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    // Published exams
    if (exams) {
      for (const e of exams) {
        xml += `  <url>
    <loc>${SITE_URL}/exams/${escapeXml(e.id)}</loc>
    <lastmod>${formatDate(e.updated_at)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    // CMS pages
    const staticSlugs = new Set(['home', 'events', 'knowledge', 'coaching', 'blog', 'exams', 'about', 'contact', 'testimonials', 'ai-tools']);
    if (cmsPages) {
      for (const p of cmsPages) {
        if (staticSlugs.has(p.slug)) continue;
        xml += `  <url>
    <loc>${SITE_URL}/${escapeXml(p.slug)}</loc>
    <lastmod>${formatDate(p.updated_at)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Error generating sitemap');
  }
}
