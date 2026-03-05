import React, { useState, useMemo } from 'react';
import { useCourseFeedback, CourseFeedback } from '@/hooks/useCourseFeedback';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// ─── Palette (shared across all pages) ──────────────────────────────────────
const p = {
  white: '#FFFFFF',
  skyTeal: '#F0FAFA',
  deepTeal: '#004D4D',
  lightTeal: '#B2DFDF',
  paleTeal: '#D9F2F2',
  orange: '#FF9715',
  body: '#374151',
  muted: '#6B7280',
};

// ─── Shared sub-components ──────────────────────────────────────────────────

export const Stars = ({ rating, max = 10, size = 12 }: { rating: number; max?: number; size?: number }) => {
  const filled = Math.round((rating / max) * 5);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 256 256" fill={i < filled ? p.orange : p.paleTeal}>
          <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z"/>
        </svg>
      ))}
    </div>
  );
};

export const LinkedInIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

// ─── Helper ─────────────────────────────────────────────────────────────────
const displayName = (f: CourseFeedback, firstNameOnly = false) =>
  firstNameOnly ? f.first_name : `${f.first_name} ${f.last_name}`.trim();

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 1 — Event card inline quote
// Shows beneath a course description inside an event card
// ═══════════════════════════════════════════════════════════════════════════

export const EventCardQuote: React.FC<{ course: string }> = ({ course }) => {
  const { data: feedback } = useCourseFeedback({ isApproved: true, courseType: course });
  const { settings } = useSiteSettings();
  const firstNameOnly = settings?.show_testimonial_first_name_only ?? false;

  const testimonial = useMemo(() => {
    if (!feedback?.length) return null;
    // Pick highest-rated, then most recent
    return [...feedback].sort((a, b) => b.rating - a.rating || new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];
  }, [feedback]);

  if (!testimonial) return null;

  return (
    <div style={{ borderTop: `1px solid ${p.paleTeal}`, paddingTop: 14, marginTop: 4 }}>
      <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>What attendees say</div>
      <div style={{ background: p.skyTeal, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ color: p.body, fontSize: 12, lineHeight: 1.65, marginBottom: 10, fontStyle: 'italic' }}>
          "{testimonial.comment}"
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 11 }}>{displayName(testimonial, firstNameOnly)}</div>
            <div style={{ color: p.muted, fontSize: 10 }}>{testimonial.job_title || ''}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Stars rating={testimonial.rating} size={10} />
            {testimonial.source === 'linkedin' && <LinkedInIcon />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 2 — Homepage strip (rotating)
// A full-width band between sections, cycles through quotes
// ═══════════════════════════════════════════════════════════════════════════

export const HomepageStrip: React.FC = () => {
  const { data: feedback } = useCourseFeedback({ isApproved: true });
  const { settings } = useSiteSettings();
  const firstNameOnly = settings?.show_testimonial_first_name_only ?? false;
  const [active, setActive] = useState(0);

  const items = useMemo(() => {
    if (!feedback?.length) return [];
    // Sort by rating desc, take top entries
    return [...feedback].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [feedback]);

  if (!items.length) return null;

  const t = items[active % items.length];

  return (
    <div style={{ background: '#006666', padding: '56px 48px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: p.lightTeal, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>What practitioners say</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 500, lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic', minHeight: 80 }}>
          "{t.comment}"
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 28 }}>
          <Stars rating={t.rating} size={14} />
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{displayName(t, firstNameOnly)}</div>
          <div style={{ color: p.lightTeal, fontSize: 12 }}>{t.job_title}{t.job_title && t.company ? ' · ' : ''}{t.company}</div>
          {t.source === 'linkedin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: p.lightTeal, fontSize: 11, marginTop: 2 }}>
              <LinkedInIcon /><span>via LinkedIn</span>
            </div>
          )}
        </div>
        {/* dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 4, background: i === active ? p.orange : 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT 3 — About page sidebar cards
// 2-3 stacked cards in the credentials column
// ═══════════════════════════════════════════════════════════════════════════

export const AboutSidebarQuotes: React.FC = () => {
  const { data: feedback } = useCourseFeedback({ isApproved: true });
  const { settings } = useSiteSettings();
  const firstNameOnly = settings?.show_testimonial_first_name_only ?? false;

  const items = useMemo(() => {
    if (!feedback?.length) return [];
    return [...feedback].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [feedback]);

  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>What people say</div>
      {items.map((t, i) => (
        <div key={i} style={{ background: p.white, borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,77,77,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <Stars rating={t.rating} size={11} />
            {t.source === 'linkedin' && <LinkedInIcon />}
          </div>
          <div style={{ color: p.body, fontSize: 12, lineHeight: 1.65, marginBottom: 10, fontStyle: 'italic' }}>
            "{t.comment.length > 120 ? t.comment.slice(0, 120) + '…' : t.comment}"
          </div>
          <div>
            <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 11 }}>{displayName(t, firstNameOnly)}</div>
            <div style={{ color: p.muted, fontSize: 10 }}>{t.job_title || ''}</div>
            <div style={{ color: p.muted, fontSize: 10 }}>{t.company || ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
