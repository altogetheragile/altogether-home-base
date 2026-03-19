import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import { useKnowledgeItemBySlug, useKnowledgeItems, KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useKnowledgeItemSteps } from '@/hooks/useKnowledgeItemSteps';
import { useKnowledgeUseCases } from '@/hooks/useKnowledgeUseCases';
import { useKnowledgeItemUnifiedAssets } from '@/hooks/useUnifiedAssetManager';
import { useViewTracking } from '@/hooks/useViewTracking';
import { TechniqueSchema, BreadcrumbSchema } from '@/components/seo/JsonLd';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { colors as p } from '@/theme/colors';

// ─── Mobile detection hook ──────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const categoryColours: Record<string, { solid: string; pill: string; bg: string }> = {
  Analysis:     { solid: '#1A9090', pill: '#0D5C5C', bg: '#E6F5F5' },
  Planning:     { solid: '#2BBABA', pill: '#1A7A7A', bg: '#E4F7F7' },
  Delivery:     { solid: '#F28C00', pill: '#8A4F00', bg: '#FFF3E0' },
  Facilitation: { solid: '#2E9E6E', pill: '#1A5C40', bg: '#E6F5EE' },
  Strategy:     { solid: '#6B5FCC', pill: '#3D3580', bg: '#EEECF9' },
};

// ─── Responsive CSS classes ─────────────────────────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-technique-layout { display: grid; grid-template-columns: 1fr 300px; gap: 48px; align-items: start; }
    .aa-sticky-sidebar { position: sticky; top: 80px; }
    .aa-when-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .aa-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

    @media (max-width: 767px) {
      .aa-technique-layout { grid-template-columns: 1fr; }
      .aa-sticky-sidebar { position: static; }
      .aa-when-grid { grid-template-columns: 1fr; }
      .aa-related-grid { grid-template-columns: 1fr; }
    }
  `}</style>
);

// ─── Phosphor-style bold SVG icons ──────────────────────────────────────────
const Icons = {
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
    </svg>
  ),
  XCircle: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M165.66,101.66l-37.66,37.67L90.34,101.66A8,8,0,0,0,79,112l37.67,37.66L79,187.32A8,8,0,0,0,90.34,198.64l37.66-37.67,37.66,37.67a8,8,0,0,0,11.32-11.32L139.31,149.66,177,112a8,8,0,0,0-11.32-11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
    </svg>
  ),
  GraduationCap: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V117.87l16-8.81V192a8,8,0,0,0,16,0V96A8,8,0,0,0,251.76,88.94ZM128,175.89,41.91,128.39,128,80.13l86.09,48.26ZM208,192H48V127l72,40h0a8,8,0,0,0,3.76,1h.48A8,8,0,0,0,128,167l72-40Z"/>
    </svg>
  ),
  Chat: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
    </svg>
  ),
  Books: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M231.65,194.53,198.28,39.06a16,16,0,0,0-19.21-12.19L132.78,37.31a16.08,16.08,0,0,0-12.19,19.22l4.33,20.29A16,16,0,0,0,112,72H48A16,16,0,0,0,32,88V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16v-1.56A15.92,15.92,0,0,0,231.65,194.53ZM168.27,41.14,204.93,213l-43.1,9.2L125.17,50.33ZM48,88h64v16H48Zm0,32h64v16H48Zm0,80V152h64v48Zm168,0H128V152h40a8,8,0,0,0,0-16H128V136h40a8,8,0,0,0,0-16H128V88h64Z"/>
    </svg>
  ),
  ImagePlaceholder: () => (
    <svg width="24" height="24" viewBox="0 0 256 256" fill={p.midTeal}>
      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,200V172l52-52,44,44a16,16,0,0,0,22.63,0l20-20L216,181.38V200Z"/>
    </svg>
  ),
};

// ─── Section heading ────────────────────────────────────────────────────────
const SectionHeading = ({ label, title }: { label: string; title: string }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ color: p.orange, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <h2 style={{ color: p.deepTeal, fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{title}</h2>
  </div>
);

// ─── Helpers ────────────────────────────────────────────────────────────────
function getPrimaryCategory(item: KnowledgeItem): string {
  const primary = item.categories?.find((c) => c.is_primary);
  if (primary) return primary.name;
  if (item.categories?.length > 0) return item.categories[0].name;
  return 'Analysis';
}

function getHorizons(item: KnowledgeItem): string[] {
  return (item.decision_levels || []).map((d) => d.name);
}

function getDomains(item: KnowledgeItem): string[] {
  return (item.domains || []).map((d) => d.name);
}

// ─── Main Component ─────────────────────────────────────────────────────────
const Technique: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const isMobile = useIsMobile();

  const { data: item, isLoading, error } = useKnowledgeItemBySlug(slug || '');
  const { data: steps } = useKnowledgeItemSteps(item?.id);
  const { data: useCases } = useKnowledgeUseCases(item?.id || '');
  const { data: mediaAssets } = useKnowledgeItemUnifiedAssets(item?.id);
  useViewTracking(item?.id || '');

  // Fetch related techniques by slug
  const relatedSlugs = item?.related_techniques || [];
  const { data: allItems } = useKnowledgeItems({ sortBy: 'alphabetical' });
  const relatedItems = useMemo(() => {
    if (!allItems || relatedSlugs.length === 0) return [];
    return allItems.filter((i) => relatedSlugs.includes(i.slug) && i.slug !== slug).slice(0, 3);
  }, [allItems, relatedSlugs, slug]);

  // Get example use case
  const exampleCase = useMemo(() => {
    if (!useCases) return null;
    return useCases.find((uc) => uc.case_type === 'example') || null;
  }, [useCases]);

  // Get first image from media assets
  const diagramImage = useMemo(() => {
    if (!mediaAssets) return null;
    const images = mediaAssets.filter((a) => a.type === 'image' && !a.is_template);
    return images.length > 0 ? images[0] : null;
  }, [mediaAssets]);

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: p.muted, fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: p.deepTeal, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Technique not found</div>
          <p style={{ color: p.muted, fontSize: 15, marginBottom: 24 }}>The technique you're looking for doesn't exist.</p>
          <Link to="/knowledge" style={{ background: p.orange, color: '#fff', padding: '11px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            Back to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  const catName = getPrimaryCategory(item);
  const col = categoryColours[catName] || categoryColours.Analysis;
  const horizons = getHorizons(item);
  const domains = getDomains(item);
  const itemData = item as KnowledgeItem & {
    use_this_when?: string[];
    avoid_when?: string[];
    related_techniques?: string[];
  };

  // Split background text into paragraphs for "What it is"
  const whatParagraphs = item.background
    ? item.background.split(/\n\n|\n/).filter((p) => p.trim())
    : item.description
    ? [item.description]
    : [];

  const sortedSteps = (steps || []).slice().sort((a, b) => a.position - b.position);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <Helmet>
        <title>{item.name} — Altogether Agile Knowledge Base</title>
        <meta name="description" content={item.description || `Learn about ${item.name} — a practical agile technique from the Altogether Agile knowledge base.`} />
        <meta property="og:title" content={item.name} />
        <meta property="og:description" content={item.description || `Learn about ${item.name} — a practical agile technique.`} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:type" content="article" />
        {slug && <link rel="canonical" href={`${SITE_URL}/knowledge/${slug}`} />}
      </Helmet>
      <TechniqueSchema
        name={item.name}
        description={item.description}
        url={`${SITE_URL}/knowledge/${slug}`}
        category={item.categories?.[0]?.name}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: 'Knowledge Base', url: `${SITE_URL}/knowledge` },
        { name: item.name, url: `${SITE_URL}/knowledge/${slug}` },
      ]} />
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <Navigation />

      {/* ─── HERO BAND ─── */}
      <div style={{ background: '#006666', padding: isMobile ? '40px 20px 36px' : '56px 48px 48px' }}>
        {/* breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: p.lightTeal, fontSize: 12 }}>
          <Link to="/knowledge" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: p.lightTeal, textDecoration: 'none' }}>
            <Icons.ArrowLeft /> Knowledge Base
          </Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ opacity: 0.7 }}>{catName}</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: '#fff' }}>{item.name}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <span style={{ background: col.pill, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{catName}</span>
          {horizons.map((h) => (
            <span key={h} style={{ background: 'rgba(255,255,255,0.12)', color: p.lightTeal, fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        <h1 style={{ color: '#fff', fontSize: isMobile ? 32 : 48, fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px' }}>{item.name}</h1>
        <p style={{ color: p.lightTeal, fontSize: 17, lineHeight: 1.65, margin: 0, maxWidth: 620 }}>{item.description}</p>
      </div>

      {/* ─── MAIN CONTENT + SIDEBAR ─── */}
      <div style={{ padding: isMobile ? '32px 20px' : '56px 48px', background: p.skyTeal }}>
        <div className="aa-technique-layout">

          {/* LEFT — main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

            {/* WHAT IT IS */}
            {whatParagraphs.length > 0 && (
              <div>
                <SectionHeading label="Overview" title="What it is" />
                {whatParagraphs.map((para, i) => (
                  <p key={i} style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>{para}</p>
                ))}
              </div>
            )}

            {/* WHEN TO USE */}
            {((itemData.use_this_when && itemData.use_this_when.length > 0) || (itemData.avoid_when && itemData.avoid_when.length > 0)) && (
              <div>
                <SectionHeading label="Application" title="When to use it — and when not to" />
                <div className="aa-when-grid">
                  {itemData.use_this_when && itemData.use_this_when.length > 0 && (
                    <div style={{ background: '#EAF5F5', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '20px 20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <span style={{ color: '#5BA8A8' }}><Icons.CheckCircle /></span>
                          <span style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13 }}>Use it when</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {itemData.use_this_when.map((text, i) => (
                            <div key={i} style={{ color: p.body, fontSize: 13, lineHeight: 1.6, paddingLeft: 20, position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, top: 4, width: 6, height: 6, borderRadius: '50%', background: '#5BA8A8', display: 'block' }} />
                              {text}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {itemData.avoid_when && itemData.avoid_when.length > 0 && (
                    <div style={{ background: '#FFF6E8', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '20px 20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <span style={{ color: '#FFC266' }}><Icons.XCircle /></span>
                          <span style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13 }}>Don't use it when</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {itemData.avoid_when.map((text, i) => (
                            <div key={i} style={{ color: p.body, fontSize: 13, lineHeight: 1.6, paddingLeft: 20, position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, top: 4, width: 6, height: 6, borderRadius: '50%', background: '#FFC266', display: 'block' }} />
                              {text}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HOW TO RUN IT */}
            {sortedSteps.length > 0 && (
              <div>
                <SectionHeading label="Instructions" title="How to run it" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {sortedSteps.map((step, i) => (
                    <div key={step.id} style={{ display: 'flex', gap: 20, position: 'relative' }}>
                      {i < sortedSteps.length - 1 && (
                        <div style={{ position: 'absolute', left: 19, top: 40, bottom: -8, width: 2, background: p.paleTeal }} />
                      )}
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.deepTeal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0, zIndex: 1 }}>{i + 1}</div>
                      <div style={{ background: p.white, borderRadius: 12, padding: '16px 20px', marginBottom: 8, flex: 1 }}>
                        <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{step.title}</div>
                        {step.description && (
                          <div style={{ color: p.body, fontSize: 13, lineHeight: 1.7 }}>{step.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DIAGRAM / IMAGE */}
            <div>
              <SectionHeading label="Visual" title="Diagram" />
              {diagramImage ? (
                <div style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <img
                    src={diagramImage.url}
                    alt={diagramImage.title || item.name}
                    loading="lazy"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ background: p.paleTeal, borderRadius: 14, height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: p.lightTeal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.ImagePlaceholder />
                  </div>
                  {/* label hidden for production */}
                </div>
              )}
            </div>

            {/* WORKED EXAMPLE */}
            {exampleCase && (
              <div>
                <SectionHeading label="Worked Example" title={exampleCase.title || 'Example'} />
                <div style={{ background: p.white, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ background: p.deepTeal, padding: '14px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ background: p.orange, borderRadius: 6, padding: '3px 10px', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scenario</div>
                    {exampleCase.title && (
                      <span style={{ color: p.lightTeal, fontSize: 12 }}>{exampleCase.title}</span>
                    )}
                  </div>
                  <div style={{ padding: 24 }}>
                    {exampleCase.what && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Context</div>
                        <p style={{ color: p.body, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{exampleCase.what}</p>
                      </div>
                    )}
                    {exampleCase.how && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>What happened</div>
                        <p style={{ color: p.body, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{exampleCase.how}</p>
                      </div>
                    )}
                    {exampleCase.summary && (
                      <div style={{ background: p.paleTeal, borderRadius: 10, padding: '16px 20px' }}>
                        <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Outcome</div>
                        <p style={{ color: p.body, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{exampleCase.summary}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT — sticky sidebar */}
          <div className="aa-sticky-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* At a glance */}
            <div style={{ background: p.white, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,77,77,0.07)' }}>
              <div style={{ background: col.bg, padding: '16px 20px', borderBottom: `1px solid ${p.paleTeal}` }}>
                <span style={{ background: col.pill, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{catName}</span>
              </div>
              <div style={{ padding: '20px 20px 24px' }}>
                <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>At a glance</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {horizons.length > 0 && (
                    <div>
                      <div style={{ color: p.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Planning Horizons</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {horizons.map((h) => (
                          <span key={h} style={{ background: p.paleTeal, color: p.midTeal, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {domains.length > 0 && (
                    <div>
                      <div style={{ color: p.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Domains</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {domains.map((d) => (
                          <span key={d} style={{ background: p.skyTeal, color: p.deepTeal, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: `1px solid ${p.paleTeal}` }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.source && (
                    <div>
                      <div style={{ color: p.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Origins</div>
                      <div style={{ color: p.body, fontSize: 13 }}>{item.source}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: '#006666', borderRadius: 14, padding: '20px 20px 24px' }}>
              <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Go deeper</div>
              <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.65, margin: '0 0 16px' }}>
                Want to practise this technique with your team? Book a free chemistry session to talk through how it applies to your context.
              </p>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: p.orange, color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', textDecoration: 'none', boxSizing: 'border-box', justifyContent: 'center' }}>
                <Icons.Chat />Book a Chemistry Session
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* ─── RELATED TECHNIQUES ─── */}
      {relatedItems.length > 0 && (
        <div style={{ background: p.white, padding: isMobile ? '40px 20px' : '56px 48px' }}>
          <SectionHeading label="Keep exploring" title="Related techniques" />
          <div className="aa-related-grid">
            {relatedItems.map((rel) => {
              const relCat = getPrimaryCategory(rel);
              const relCol = categoryColours[relCat] || categoryColours.Analysis;
              return (
                <Link
                  key={rel.id}
                  to={`/knowledge/${rel.slug}`}
                  style={{ background: p.white, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,77,77,0.06)', textDecoration: 'none', display: 'block' }}
                >
                  <div style={{ background: relCol.bg, padding: '14px 20px' }}>
                    <span style={{ background: relCol.pill, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{relCat}</span>
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ color: p.deepTeal, fontSize: 16, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3 }}>{rel.name}</div>
                    <div style={{ color: p.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{rel.description || ''}</div>
                    <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      Read more <Icons.ArrowRight />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
};

export default Technique;
