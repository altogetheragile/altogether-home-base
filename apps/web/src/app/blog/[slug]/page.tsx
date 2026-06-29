import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPost, renderArticle, formatDate } from '@/lib/blog';
import { buildMetadata, JsonLd, blogPostingJsonLd, breadcrumbJsonLd, truncateText } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const c = {
  white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF',
  midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found' };
  return buildMetadata({
    title: post.seo_title || post.title,
    description: post.seo_description || truncateText(post.excerpt || post.title, 160),
    path: `/blog/${slug}`,
    type: 'article',
    ogImage: post.featured_image_url || undefined,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const date = formatDate(post.published_at);
  const reading = post.estimated_reading_time && post.estimated_reading_time > 0 ? `${post.estimated_reading_time} min read` : '';

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px' }}>
      <JsonLd data={blogPostingJsonLd({ title: post.title, description: post.seo_description || post.excerpt || post.title, path: `/blog/${slug}`, image: post.featured_image_url, datePublished: post.published_at, dateModified: post.updated_at })} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${slug}` }])} />

      <nav style={{ fontSize: 13, color: c.muted, marginBottom: 16 }}>
        <Link href="/" style={{ color: c.muted }}>Home</Link> / <Link href="/blog" style={{ color: c.muted }}>Blog</Link>
      </nav>

      <article>
        {post.blog_categories && (
          <span style={{ display: 'inline-block', background: post.blog_categories.color || c.skyTeal, color: c.white, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>{post.blog_categories.name}</span>
        )}
        <h1 style={{ color: c.deepTeal, fontSize: 36, fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px' }}>{post.title}</h1>
        {(date || reading) && (
          <div style={{ display: 'flex', gap: 8, fontSize: 14, color: c.muted, marginBottom: 24 }}>
            {date && <span>{date}</span>}
            {date && reading && <span>·</span>}
            {reading && <span>{reading}</span>}
          </div>
        )}
        {post.featured_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featured_image_url} alt={post.title} style={{ width: '100%', height: 'auto', borderRadius: 12, marginBottom: 28 }} />
        )}
        <div className="blog-html-body" dangerouslySetInnerHTML={{ __html: renderArticle(post.content) }} />
      </article>

      <style>{`
        .blog-html-body h1 { color:${c.deepTeal}; font-size:28px; font-weight:800; margin:2.5rem 0 .75rem; line-height:1.2; }
        .blog-html-body h2 { color:${c.deepTeal}; font-size:24px; font-weight:700; margin:2.5rem 0 .75rem; line-height:1.3; }
        .blog-html-body h3 { color:#006666; font-size:20px; font-weight:700; margin:2rem 0 .625rem; }
        .blog-html-body p { color:${c.body}; font-size:16px; line-height:1.8; margin-bottom:16px; }
        .blog-html-body strong { color:${c.deepTeal}; font-weight:700; }
        .blog-html-body a { color:${c.midTeal}; font-weight:600; text-decoration:underline; }
        .blog-html-body ul, .blog-html-body ol { color:${c.body}; font-size:16px; line-height:1.8; padding-left:24px; margin-bottom:16px; }
        .blog-html-body li { margin-bottom:4px; }
        .blog-html-body blockquote { border-left:3px solid ${c.orange}; padding-left:16px; margin:24px 0; color:#006666; font-style:italic; }
        .blog-html-body code { background:${c.skyTeal}; padding:2px 6px; border-radius:4px; font-size:14px; }
        .blog-html-body img { max-width:100%; border-radius:10px; margin:16px 0; }
        .blog-html-body hr { border:none; border-top:1px solid ${c.paleTeal}; margin:2.5rem 0; }
        .blog-html-body table { border-collapse:collapse; width:100%; margin:1.5rem 0; }
        .blog-html-body table td, .blog-html-body table th { padding:8px 0; vertical-align:top; }
      `}</style>
    </main>
  );
}
