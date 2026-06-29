import type { Metadata } from 'next';
import { getPosts } from '@/lib/blog';
import { buildMetadata, JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo';
import { BlogList } from './BlogList';

export const dynamic = 'force-dynamic';

const c = { white: '#FFFFFF', paleTeal: '#D9F2F2', deepTeal: '#004D4D' };

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description:
    'Expert insights, practical tips, and thought leadership on agile methodologies, team dynamics, and organizational transformation.',
  path: '/blog',
});

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])} />
      <JsonLd data={itemListJsonLd(posts.map((p) => ({ name: p.title, path: `/blog/${p.slug}` })))} />

      <div style={{ background: `linear-gradient(135deg, ${c.deepTeal} 0%, #006666 100%)`, padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: c.white, fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Blog</h1>
        <p style={{ color: c.paleTeal, fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 600, marginInline: 'auto' }}>
          Practical insights on agile delivery, coaching, AI and ways of working, drawn from 25 years
          of hands-on experience.
        </p>
      </div>

      <BlogList posts={posts} />
    </>
  );
}
