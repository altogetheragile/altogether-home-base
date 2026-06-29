'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BlogPostRow } from '@/lib/blog';
import { formatDate } from '@/lib/format';

const c = {
  white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF',
  midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280',
};

function Card({ post }: { post: BlogPostRow }) {
  const date = formatDate(post.published_at);
  const reading = post.estimated_reading_time && post.estimated_reading_time > 0 ? `${post.estimated_reading_time} min read` : '';
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card" style={{ background: c.white, borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
      {post.featured_image_url ? (
        <div style={{ height: 180, background: '#F5F5F5' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.featured_image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ height: 8, background: post.blog_categories?.color || c.skyTeal }} />
      )}
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {post.blog_categories && (
          <span style={{ alignSelf: 'flex-start', background: post.blog_categories.color || c.skyTeal, color: c.white, fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>{post.blog_categories.name}</span>
        )}
        <h2 style={{ color: c.deepTeal, fontSize: 18, fontWeight: 700, lineHeight: 1.3, margin: '0 0 8px' }}>{post.title}</h2>
        {post.excerpt && <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 16px', flex: 1 }}>{post.excerpt}</p>}
        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: c.muted, marginTop: 'auto' }}>
          {date && <span>{date}</span>}
          {date && reading && <span>·</span>}
          {reading && <span>{reading}</span>}
        </div>
      </div>
    </Link>
  );
}

export function BlogList({ posts }: { posts: BlogPostRow[] }) {
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null }>();
    for (const p of posts) if (p.blog_categories) map.set(p.blog_categories.slug, { name: p.blog_categories.name, color: p.blog_categories.color });
    return Array.from(map.entries()).map(([slug, v]) => ({ slug, ...v }));
  }, [posts]);

  const [active, setActive] = useState<string>('all');
  const shown = active === 'all' ? posts : posts.filter((p) => p.blog_categories && categoriesSlug(p) === active);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 48px' }}>
      {categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          <Chip label="All" activeChip={active === 'all'} onClick={() => setActive('all')} />
          {categories.map((cat) => (
            <Chip key={cat.slug} label={cat.name} activeChip={active === cat.slug} onClick={() => setActive(cat.slug)} />
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {shown.map((p) => <Card key={p.slug} post={p} />)}
        {shown.length === 0 && <p style={{ color: c.muted }}>No posts in this category yet.</p>}
      </div>
      <style>{`.blog-card{transition:box-shadow .2s,transform .2s}.blog-card:hover{box-shadow:0 8px 24px rgba(0,77,77,.10);transform:translateY(-2px)}`}</style>
    </div>
  );
}

function categoriesSlug(p: BlogPostRow) {
  return p.blog_categories?.slug;
}

function Chip({ label, activeChip, onClick }: { label: string; activeChip: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeChip ? c.deepTeal : c.skyTeal, color: activeChip ? c.white : c.deepTeal }}>{label}</button>
  );
}
