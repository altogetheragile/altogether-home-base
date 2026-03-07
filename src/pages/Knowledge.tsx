import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import { useKnowledgeItems, KnowledgeItem } from '@/hooks/useKnowledgeItems';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';

// ─── Palette ────────────────────────────────────────────────────────────────
const p = {
  white: '#FFFFFF',
  skyTeal: '#F0FAFA',
  deepTeal: '#004D4D',
  midTeal: '#007A7A',
  lightTeal: '#B2DFDF',
  paleTeal: '#D9F2F2',
  orange: '#FF9715',
  body: '#374151',
  muted: '#6B7280',
};

const categoryColours: Record<string, { bg: string; text: string; pill: string; light: string }> = {
  Analysis:     { bg: '#1A9090', text: '#fff', pill: '#0D5C5C', light: '#E6F5F5' },
  Planning:     { bg: '#2BBABA', text: '#fff', pill: '#1A7A7A', light: '#E4F7F7' },
  Delivery:     { bg: '#F28C00', text: '#fff', pill: '#8A4F00', light: '#FFF3E0' },
  Facilitation: { bg: '#2E9E6E', text: '#fff', pill: '#1A5C40', light: '#E6F5EE' },
  Strategy:     { bg: '#6B5FCC', text: '#fff', pill: '#3D3580', light: '#EEECF9' },
};

// ─── Responsive CSS classes (media-query driven) ────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-kb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .aa-section-pad { padding: 64px 48px; }
    .aa-page-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: end; }

    @media (max-width: 767px) {
      .aa-kb-grid { grid-template-columns: 1fr; }
      .aa-section-pad { padding: 32px 20px; }
      .aa-page-intro { grid-template-columns: 1fr; gap: 24px; }
    }
  `}</style>
);

// ─── Phosphor-style bold SVG icons (exact from reference) ───────────────────
const Icons = {
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
    </svg>
  ),
  MagnifyingGlass: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M229.66,218.34l-50.07-50.06a88.21,88.21,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
    </svg>
  ),
  Tag: () => (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z"/>
    </svg>
  ),
  Books: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M231.65,194.53,198.28,39.06a16,16,0,0,0-19.21-12.19L132.78,37.31a16.08,16.08,0,0,0-12.19,19.22l4.33,20.29A16,16,0,0,0,112,72H48A16,16,0,0,0,32,88V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16v-1.56A15.92,15.92,0,0,0,231.65,194.53ZM168.27,41.14,204.93,213l-43.1,9.2L125.17,50.33ZM48,88h64v16H48Zm0,32h64v16H48Zm0,80V152h64v48Zm168,0H128V152h40a8,8,0,0,0,0-16H128V136h40a8,8,0,0,0,0-16H128V88h64Z"/>
    </svg>
  ),
  Chat: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
    </svg>
  ),
};

// ─── Technique card image ───────────────────────────────────────────────────
const TechniqueImage = ({ category, index, imageUrl }: { category: string; index: number; imageUrl?: string | null }) => {
  const col = categoryColours[category] || categoryColours.Analysis;

  if (imageUrl) {
    return (
      <div style={{
        height: 140,
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
      }}>
        <img
          src={imageUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      height: 140,
      background: col.bg,
      borderRadius: '12px 12px 0 0',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '16px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', bottom: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', bottom: -8, right: -8, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>{index + 1}</div>
      {/* label hidden for production */}
    </div>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function getPrimaryCategory(item: KnowledgeItem): string {
  const primary = item.categories?.find((c) => c.is_primary);
  if (primary) return primary.name;
  if (item.categories?.length > 0) return item.categories[0].name;
  return 'Analysis';
}

function getOrigins(item: KnowledgeItem): string {
  if (item.source) return item.source;
  if (item.background) {
    // Truncate long background text
    return item.background.length > 80 ? item.background.slice(0, 77) + '...' : item.background;
  }
  return '';
}

const FILTERS = ['All', 'Analysis', 'Planning', 'Delivery', 'Facilitation', 'Strategy'];

// ─── Main Component ─────────────────────────────────────────────────────────
const Knowledge: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Fetch all published knowledge items
  const { data: allItems, isError: knowledgeError, refetch: refetchKnowledge } = useKnowledgeItems({ sortBy: 'alphabetical' });

  // Client-side filtering by category + search
  const filtered = useMemo(() => {
    if (!allItems) return [];
    return allItems
      .filter((item) => {
        if (activeFilter === 'All') return true;
        const cat = getPrimaryCategory(item);
        return cat === activeFilter;
      })
      .filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q)
        );
      });
  }, [allItems, activeFilter, search]);

  const totalCount = allItems?.length || 0;
  const categoryCount = useMemo(() => {
    if (!allItems) return 0;
    const cats = new Set(allItems.map((i) => getPrimaryCategory(i)));
    return cats.size;
  }, [allItems]);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <Helmet>
        <title>Knowledge Base — Altogether Agile</title>
        <meta name="description" content="Explore 80+ agile techniques, frameworks, and practices. Practical guides for Scrum, Kanban, facilitation, and team coaching." />
        <link rel="canonical" href={`${SITE_URL}/knowledge`} />
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <Navigation />

      {/* ─── PAGE INTRO ─── */}
      <div style={{ background: '#006666', padding: isMobile ? '40px 20px 0' : '64px 48px 0' }}>
        <div className="aa-page-intro" style={{ paddingBottom: isMobile ? 32 : 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Knowledge Base</div>
            <h1 style={{ color: '#fff', fontSize: isMobile ? 32 : 46, fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
              80+ techniques.<br />All explained properly.
            </h1>
            <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              Every technique covers purpose, usage, origins, and how it connects to the wider agile landscape. Searchable by category and framework. Built for practitioners, not textbooks.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'flex-end' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: p.lightTeal, pointerEvents: 'none' }}>
                <Icons.MagnifyingGlass />
              </div>
              <input
                type="text"
                placeholder="Search techniques..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '13px 16px 13px 42px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { n: totalCount > 0 ? `${totalCount}+` : '—', label: 'Techniques' },
                { n: String(categoryCount || '—'), label: 'Categories' },
                { n: '6', label: 'Frameworks' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ color: p.orange, fontSize: 22, fontWeight: 800 }}>{s.n}</div>
                  <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── FILTER TABS ─── */}
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              aria-pressed={activeFilter === f}
              style={{
                background: 'none',
                border: 'none',
                padding: '16px 24px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                color: activeFilter === f ? p.orange : p.lightTeal,
                borderBottom: activeFilter === f ? `3px solid ${p.orange}` : '3px solid transparent',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}
            >{f}</button>
          ))}
          <div style={{ marginLeft: 'auto', paddingRight: 4, color: p.lightTeal, fontSize: 12, whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'technique' : 'techniques'}
          </div>
        </div>
      </div>

      {/* ─── CARDS GRID ─── */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        {knowledgeError ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: p.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: p.body }}>Failed to load knowledge items. Please try again.</div>
            <button
              onClick={() => refetchKnowledge()}
              style={{ background: p.deepTeal, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : (
        <>
        <div className="aa-kb-grid">
          {filtered.map((item, i) => {
            const catName = getPrimaryCategory(item);
            const col = categoryColours[catName] || categoryColours.Analysis;
            const origins = getOrigins(item);

            return (
              <div key={item.id} style={{ background: p.white, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,77,77,0.07)' }}>
                <TechniqueImage category={catName} index={i} imageUrl={(item as any).hero_image_url || null} />
                <div style={{ padding: '20px 20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* category pill */}
                  <div>
                    <span style={{ background: col.pill, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{catName}</span>
                  </div>

                  {/* title */}
                  <div style={{ color: p.deepTeal, fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>{item.name}</div>

                  {/* summary */}
                  <div style={{ color: p.muted, fontSize: 13, lineHeight: 1.65, flex: 1 }}>{item.description || ''}</div>

                  {/* meta */}
                  <div style={{ borderTop: `1px solid ${p.paleTeal}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* horizons (decision levels) */}
                    {item.decision_levels && item.decision_levels.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: p.muted, fontSize: 11, fontWeight: 600 }}>Horizons:</span>
                        {item.decision_levels.map((dl) => (
                          <span key={dl.id} style={{ background: p.paleTeal, color: p.midTeal, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{dl.name}</span>
                        ))}
                      </div>
                    )}

                    {/* domains as frameworks */}
                    {item.domains && item.domains.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: p.muted, fontSize: 11, fontWeight: 600 }}>Domains:</span>
                        {item.domains.map((d) => (
                          <span key={d.id} style={{ background: p.skyTeal, color: p.deepTeal, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: `1px solid ${p.paleTeal}` }}>{d.name}</span>
                        ))}
                      </div>
                    )}

                    {/* origins */}
                    {origins && (
                      <div style={{ color: p.muted, fontSize: 11 }}>
                        <span style={{ fontWeight: 600 }}>Origins: </span>{origins}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    to={`/knowledge/${item.slug}`}
                    style={{ marginTop: 4, background: 'none', border: 'none', padding: 0, color: p.deepTeal, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', textDecoration: 'none' }}
                  >
                    Read full technique <Icons.ArrowRight />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: p.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>—</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No techniques match your search.</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Try a different search term or clear the filter.</div>
          </div>
        )}
        </>
        )}
      </div>

      {/* ─── CTA BAND ─── */}
      <div style={{ background: '#006666', padding: isMobile ? '40px 20px' : '56px 48px' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 40, alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Go Deeper</div>
            <h2 style={{ color: '#fff', fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>Want to use these techniques with your team?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              Altogether Agile runs hands-on workshops and certification courses built around these techniques — with real scenarios, not toy examples.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Link to="/events" style={{ background: p.orange, color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', textDecoration: 'none' }}>
              Browse Events <Icons.ArrowRight />
            </Link>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: 'none', padding: 0, color: p.lightTeal, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', textDecoration: 'none' }}>
              <Icons.Chat />Book a Chemistry Session
            </a>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
};

export default Knowledge;
