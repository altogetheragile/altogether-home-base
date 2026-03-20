import { colors as p } from '@/theme/colors';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/config/featureFlags';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { useBlogPost } from '@/hooks/useBlogPosts';
import { BlogPostSchema, BreadcrumbSchema } from '@/components/seo/JsonLd';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { RecommendationsSection } from '@/components/recommendations/RecommendationsSection';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || '');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
      <Helmet>
        <title>{post?.seo_title || post?.title || 'Blog'} — Altogether Agile</title>
        {post?.seo_description && <meta name="description" content={post.seo_description} />}
        {post?.title && <meta property="og:title" content={post.seo_title || post.title} />}
        {post?.seo_description && <meta property="og:description" content={post.seo_description} />}
        {post?.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
        <meta property="og:type" content="article" />
        {slug && <link rel="canonical" href={`${SITE_URL}/blog/${slug}`} />}
      </Helmet>
      {post && (
        <>
          <BlogPostSchema
            title={post.title}
            description={post.seo_description}
            url={`${SITE_URL}/blog/${slug}`}
            datePublished={post.published_at}
            dateModified={post.updated_at}
            imageUrl={post.featured_image_url}
          />
          <BreadcrumbSchema items={[
            { name: 'Home', url: SITE_URL },
            { name: 'Blog', url: `${SITE_URL}/blog` },
            { name: post.title, url: `${SITE_URL}/blog/${slug}` },
          ]} />
        </>
      )}
      <Navigation />

      <div style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '40px 24px 64px', width: '100%' }}>
        {/* Back link */}
        <Link
          to="/blog"
          style={{
            color: p.midTeal,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 32,
          }}
        >
          ← Back to Blog
        </Link>

        {isLoading ? (
          <div style={{ marginTop: 24 }}>
            <Skeleton style={{ height: 20, width: 100, marginBottom: 16, borderRadius: 20 }} />
            <Skeleton style={{ height: 44, width: '80%', marginBottom: 12 }} />
            <Skeleton style={{ height: 16, width: 200, marginBottom: 40 }} />
            <Skeleton style={{ height: 300, width: '100%', borderRadius: 14 }} />
          </div>
        ) : !post ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <h1 style={{ color: p.deepTeal, fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Post not found</h1>
            <p style={{ color: p.muted, fontSize: 15 }}>This blog post may have been removed or doesn't exist.</p>
          </div>
        ) : (
          <article style={{ marginTop: 24 }}>
            {/* Category tag */}
            {post.blog_categories && (
              <span style={{
                display: 'inline-block',
                background: post.blog_categories.color || p.skyTeal,
                color: p.deepTeal,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 16,
              }}>
                {post.blog_categories.name}
              </span>
            )}

            {/* Title */}
            <h1 style={{ color: p.deepTeal, fontSize: 36, fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px' }}>
              {post.title}
            </h1>

            {/* Meta line */}
            <div style={{ color: p.muted, fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              {post.published_at && (
                <span>{format(new Date(post.published_at), 'dd MMM yyyy')}</span>
              )}
              {post.estimated_reading_time > 0 && (
                <span>· {post.estimated_reading_time} min read</span>
              )}
            </div>

            {/* Orange rule */}
            <div style={{ width: 60, height: 4, borderRadius: 2, background: p.orange, marginBottom: 32 }} />

            {/* Featured image */}
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={post.title}
                loading="lazy"
                style={{ width: '100%', borderRadius: 14, marginBottom: 32, objectFit: 'contain', maxHeight: 400, background: '#F5F5F5' }}
              />
            )}

            {/* Body */}
            {post.content && (
              isHtml(post.content) ? (
                <div style={bodyWrapperStyle} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, { ADD_TAGS: ['style'], ADD_ATTR: ['style'], FORCE_BODY: true }) }} />
              ) : (
                <div style={bodyWrapperStyle}>
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 style={{ color: p.deepTeal, fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 12 }}>{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 style={{ color: '#006666', fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 10 }}>{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p style={{ color: p.body, fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ color: p.deepTeal, fontWeight: 700 }}>{children}</strong>
                      ),
                      a: ({ href, children }) => (
                        <a href={href} style={{ color: p.midTeal, fontWeight: 600, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>
                      ),
                      ul: ({ children }) => (
                        <ul style={{ color: p.body, fontSize: 16, lineHeight: 1.8, paddingLeft: 24, marginBottom: 16 }}>{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol style={{ color: p.body, fontSize: 16, lineHeight: 1.8, paddingLeft: 24, marginBottom: 16 }}>{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ marginBottom: 4 }}>{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote style={{ borderLeft: `3px solid ${p.orange}`, paddingLeft: 16, margin: '24px 0', color: '#006666', fontStyle: 'italic' }}>{children}</blockquote>
                      ),
                      code: ({ children }) => (
                        <code style={{ background: p.skyTeal, padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>{children}</code>
                      ),
                      img: ({ src, alt }) => (
                        <img src={src} alt={alt || 'Blog post image'} loading="lazy" style={{ width: '100%', borderRadius: 10, margin: '16px 0' }} />
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
              )
            )}

            {/* Author footer */}
            <div style={{ borderTop: `1px solid ${p.paleTeal}`, marginTop: 48, paddingTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: p.skyTeal, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/images/alun.webp" alt="Alun Davies-Baker" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ color: p.deepTeal, fontSize: 14, fontWeight: 700 }}>Alun Davies-Baker</div>
                <div style={{ color: p.muted, fontSize: 13 }}>Agile Coach &amp; Trainer, Altogether Agile</div>
              </div>
            </div>

            {/* CTA card */}
            <div style={{
              marginTop: 40,
              background: `linear-gradient(135deg, ${p.skyTeal} 0%, ${p.paleTeal} 100%)`,
              borderRadius: 14,
              padding: 32,
              textAlign: 'center',
            }}>
              <h3 style={{ color: p.deepTeal, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Want to discuss this topic?
              </h3>
              <p style={{ color: '#006666', fontSize: 15, marginBottom: 20, maxWidth: 460, margin: '0 auto 20px' }}>
                Get in touch to explore how these insights could help your team or organisation.
              </p>
              <Link
                to="/contact"
                style={{
                  display: 'inline-block',
                  background: p.orange,
                  color: p.white,
                  padding: '12px 32px',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
              >
                Get in Touch
              </Link>
            </div>
          </article>
        )}

        {/* Cross-content recommendations */}
        {post && (
          <div style={{ marginTop: 48, paddingTop: 40, borderTop: `1px solid ${p.paleTeal}` }}>
            <RecommendationsSection
              title="Explore More"
              contentTypes={['event', 'technique']}
              excludeIds={[post.id]}
              limit={3}
              showViewAll={false}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

/* Detect HTML content vs markdown */
const isHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);

const bodyWrapperStyle: React.CSSProperties = {
  color: p.body,
  fontSize: 16,
  lineHeight: 1.8,
};

export default BlogPost;
