'use client';

import { useEffect, useMemo, useState } from 'react';
import type { HomeTestimonial } from '@/lib/home';

const p = { paleTeal: '#D9F2F2', orange: '#FF9715' };

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  const filled = Math.round((rating / 10) * 5);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 256 256" fill={i < filled ? p.orange : p.paleTeal}>
          <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z" />
        </svg>
      ))}
    </div>
  );
}

const LinkedInIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

function ReadMore({ text, limit }: { text: string; limit: number }) {
  const [expanded, setExpanded] = useState(false);
  const needs = text.length > limit;
  const preview = needs ? text.slice(0, limit).trimEnd() + '...' : text;
  return (
    <div style={{ color: '#ffffff', fontSize: 16, lineHeight: 1.65, flex: 1 }}>
      <span style={{ fontStyle: 'italic' }}>&ldquo;{expanded ? text : preview}&rdquo;</span>
      {needs && (
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: p.orange, fontSize: 'inherit', fontWeight: 600, marginLeft: 4 }}>
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

const displayName = (t: HomeTestimonial, firstNameOnly: boolean) =>
  firstNameOnly ? t.first_name : `${t.first_name} ${t.last_name}`.trim();

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: 44, height: 44,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff', fontSize: 22, flexShrink: 0,
};

export function HomeTestimonials({ items, firstNameOnly }: { items: HomeTestimonial[]; firstNameOnly: boolean }) {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const mql1200 = window.matchMedia('(min-width: 1200px)');
    const mql768 = window.matchMedia('(min-width: 768px)');
    const update = () => setVisibleCount(mql1200.matches ? 3 : mql768.matches ? 2 : 1);
    update();
    mql1200.addEventListener('change', update);
    mql768.addEventListener('change', update);
    return () => {
      mql1200.removeEventListener('change', update);
      mql768.removeEventListener('change', update);
    };
  }, []);

  const visibleItems = useMemo(() => items.slice(startIndex, startIndex + visibleCount), [items, startIndex, visibleCount]);
  if (!items.length) return null;

  const handlePrev = () => setStartIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setStartIndex((i) => (i + visibleCount >= items.length ? 0 : i + 1));

  return (
    <div style={{ background: '#006666', padding: '56px 48px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 }}>What practitioners say</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
        <button onClick={handlePrev} aria-label="Previous testimonials" style={navBtnStyle}>{'‹'}</button>
        <div style={{ display: 'flex', gap: 24, flex: 1 }}>
          {visibleItems.map((t, i) => (
            <div key={startIndex + i} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Stars rating={t.rating} size={12} />
              <ReadMore text={t.comment} limit={200} />
              <div>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 14 }}>{displayName(t, firstNameOnly)}</div>
                <div style={{ color: p.paleTeal, fontSize: 12 }}>{t.job_title}{t.job_title && t.company ? ' · ' : ''}{t.company}</div>
                {t.source === 'linkedin' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: p.paleTeal, fontSize: 11, marginTop: 4 }}>
                    <LinkedInIcon /><span>via LinkedIn</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleNext} aria-label="Next testimonials" style={navBtnStyle}>{'›'}</button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 20, color: p.paleTeal, fontSize: 12 }}>
        {startIndex + 1}&ndash;{Math.min(startIndex + visibleCount, items.length)} of {items.length}
      </div>
    </div>
  );
}
