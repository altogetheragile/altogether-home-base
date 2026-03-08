import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/config/featureFlags";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useBlogPosts, type BlogPost } from "@/hooks/useBlogPosts";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import { useBlogTags } from "@/hooks/useBlogTags";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { format } from "date-fns";

const Blog = () => {
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>("all");
  const [selectedTag, setSelectedTag] = useState<string | undefined>("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: categories } = useBlogCategories();
  const { data: _popularTags } = useBlogTags(20);

  const { data: filteredPosts, isLoading: postsLoading } = useBlogPosts({
    search: searchQuery,
    categoryId: selectedCategory === "all" ? undefined : selectedCategory,
    tag: selectedTag === "all" ? undefined : selectedTag,
    sortBy: sortBy,
  });

  const { data: featuredPosts } = useBlogPosts({ featured: true, limit: 3 });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTag("all");
    setSortBy("newest");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedTag !== "all";

  if (!settings?.show_blog) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <h1 style={{ color: '#004D4D', fontSize: 24, fontWeight: 800 }}>Feature Unavailable</h1>
            <p style={{ color: '#6B7280', marginTop: 8 }}>This feature is currently disabled.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
      <Helmet>
        <title>Blog — Altogether Agile</title>
        <meta name="description" content="Expert insights, practical tips, and thought leadership on agile methodologies, team dynamics, and organizational transformation." />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
      </Helmet>
      <Navigation />

      {/* Hero header */}
      <div style={{ background: 'linear-gradient(135deg, #004D4D 0%, #006666 100%)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Agile Insights &amp; Resources
          </h1>
          <p style={{ color: '#D9F2F2', fontSize: 16, lineHeight: 1.6, marginTop: 12, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            Expert insights, practical tips, and thought leadership on agile methodologies,
            team dynamics, and organisational transformation.
          </p>
        </div>
      </div>

      {/* Category filter pills */}
      {categories && categories.length > 0 && (
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '16px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedCategory === "all" ? '#004D4D' : '#F0FAFA',
                color: selectedCategory === "all" ? '#FFFFFF' : '#004D4D',
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                aria-pressed={selectedCategory === cat.id}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: selectedCategory === cat.id ? '#004D4D' : '#F0FAFA',
                  color: selectedCategory === cat.id ? '#FFFFFF' : '#004D4D',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: '32px 24px', width: '100%' }}>

        {/* Search bar + filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 360 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: 14,
                outline: 'none',
                background: '#FFFFFF',
              }}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                color: '#6B7280',
                cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Featured posts */}
        {!hasActiveFilters && featuredPosts && featuredPosts.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ color: '#004D4D', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Featured</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {featuredPosts.map((post) => (
                <BlogCardStyled key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* All posts */}
        {postsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{ background: '#FFFFFF', borderRadius: 14, overflow: 'hidden' }}>
                <Skeleton style={{ height: 180, width: '100%' }} />
                <div style={{ padding: 20 }}>
                  <Skeleton style={{ height: 14, width: 80, marginBottom: 12 }} />
                  <Skeleton style={{ height: 22, width: '85%', marginBottom: 8 }} />
                  <Skeleton style={{ height: 14, width: '100%', marginBottom: 6 }} />
                  <Skeleton style={{ height: 14, width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts && filteredPosts.length > 0 ? (
          <>
            {hasActiveFilters && (
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
                {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {filteredPosts.map((post) => (
                <BlogCardStyled key={post.id} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <BookOpen style={{ width: 48, height: 48, color: '#9CA3AF', margin: '0 auto 16px' }} />
            <h3 style={{ color: '#004D4D', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No blog posts found</h3>
            <p style={{ color: '#6B7280', fontSize: 15 }}>
              {hasActiveFilters
                ? "Try adjusting your search criteria"
                : "No blog posts have been published yet"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  marginTop: 16,
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#004D4D',
                  cursor: 'pointer',
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

/* ── Card component for the blog grid ── */
const BlogCardStyled = ({ post }: { post: BlogPost }) => (
  <Link
    to={`/blog/${post.slug}`}
    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
  >
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        transition: 'box-shadow 0.2s, transform 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,77,77,0.10)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Image */}
      {post.featured_image_url ? (
        <div style={{ height: 180, overflow: 'hidden' }}>
          <img
            src={post.featured_image_url}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div style={{ height: 180, background: 'linear-gradient(135deg, #F0FAFA, #D9F2F2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen style={{ width: 32, height: 32, color: '#007A7A' }} />
        </div>
      )}

      {/* Body */}
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category tag */}
        {post.blog_categories && (
          <span style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            background: post.blog_categories.color || '#F0FAFA',
            color: '#004D4D',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
          }}>
            {post.blog_categories.name}
          </span>
        )}

        {/* Title */}
        <h3 style={{ color: '#004D4D', fontSize: 18, fontWeight: 700, lineHeight: 1.3, margin: '0 0 8px' }}>
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{
            color: '#6B7280',
            fontSize: 14,
            lineHeight: 1.6,
            margin: '0 0 12px',
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div style={{ color: '#9CA3AF', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
          {post.published_at && (
            <span>{format(new Date(post.published_at), 'dd MMM yyyy')}</span>
          )}
          {post.estimated_reading_time && post.estimated_reading_time > 0 && (
            <span>· {post.estimated_reading_time} min read</span>
          )}
        </div>
      </div>
    </div>
  </Link>
);

export default Blog;
