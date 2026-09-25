import type { Metadata } from 'next';
import { getPosts } from '@/lib/blog';
import { buildMetadata, JsonLd, breadcrumbJsonLd, itemListJsonLd } from '@/lib/seo';
import { BlogList } from './BlogList';
import { colors as c } from '@/lib/brand';
import { requireModule } from '@/lib/module-gate';
import { getCopy } from '@/lib/copy';
import { pageCrumbs } from '@/lib/copy/pageName';

export const dynamic = 'force-dynamic';


export async function generateMetadata(): Promise<Metadata> {
  const t = await getCopy('blog');
  return buildMetadata({
  title: t('blog.meta.titlePrefix'),
  description: t('blog.meta.description'),
  path: '/blog',
});
}

export default async function BlogPage() {
  await requireModule('blog');
  const [posts, t] = await Promise.all([getPosts(), getCopy('blog')]);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('blog', '/blog', 'Blog'))} />
      <JsonLd data={itemListJsonLd(posts.map((p) => ({ name: p.title, path: `/blog/${p.slug}` })))} />

      <div style={{ background: `linear-gradient(135deg, ${c.deepTeal} 0%, ${c.heroTeal} 100%)`, padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ color: c.white, fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{t('blog.hero.heading')}</h1>
        <p style={{ color: c.paleTeal, fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 600, marginInline: 'auto' }}>
          {t('blog.hero.intro')}
        </p>
      </div>

      <BlogList posts={posts} />
    </>
  );
}
