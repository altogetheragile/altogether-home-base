import { Fragment } from 'react';
import Link from 'next/link';
import { colors as p, fonts } from '@/lib/brand';
import { lines, list } from '@/lib/copy';
import { Prose, When, has } from '@/lib/copy/Prose';
import { Editable } from '@/components/edit/Editable';


const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
    <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
  </svg>
);

/**
 * The booking href comes from the page rather than being resolved here: this is a
 * client-side component with no access to site settings, and the parent already
 * has them.
 */
export default function AboutSection({ bookingUrl, founder, t}: { bookingUrl: string;
  /** Who this site's founder is. The words come from the copy registry; these are the two facts
   *  that are not sentences. */
  founder: { name: string; photo: string };
  t: (key: string) => string;
}) {
  // The photograph, the years badge and the credentials all live in the left column. A site that
  // has supplied none of them gets one column, not an empty half.
  const hasLeftColumn = Boolean(founder.photo) || has(t('home.founder.years'), t('home.founder.credentials'));
  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .aa-cred-item { opacity: 0; animation: fadeUp 0.5s ease forwards; }
        .aa-cred-item:nth-child(1) { animation-delay: 0.1s; }
        .aa-cred-item:nth-child(2) { animation-delay: 0.2s; }
        .aa-cred-item:nth-child(3) { animation-delay: 0.3s; }
        .aa-cred-item:nth-child(4) { animation-delay: 0.4s; }
        .aa-cred-item:nth-child(5) { animation-delay: 0.5s; }
        .aa-cred-item:nth-child(6) { animation-delay: 0.6s; }
        .aa-photo-wrap:hover .aa-photo-overlay { opacity: 1; }
        .aa-cta-primary:hover { background: ${p.orangeHover} !important; transform: translateY(-1px); }
        .aa-cta-secondary:hover { color: var(--aa-deep-teal) !important; gap: 10px !important; }
        .aa-about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        /* Nothing in the left column means one column, not a column of white space with the
           words pushed over to the right of it. */
        .aa-about-grid--alone { grid-template-columns: 1fr; max-width: 720px; }
        @media (max-width: 767px) { .aa-about-grid { grid-template-columns: 1fr; gap: 40px; } }
      `}</style>

      <section style={{ fontFamily: fonts.sans, background: p.white, padding: '96px 0 80px', overflow: 'hidden' }}>
        <div
          style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px' }}
          className={`aa-about-grid${hasLeftColumn ? '' : ' aa-about-grid--alone'}`}
        >
          {/* LEFT - photo + credentials */}
          {hasLeftColumn && (
          <div style={{ position: 'relative' }}>
            {/* The pale circle is scenery for the photograph. With no photograph it is a
                pale circle. */}
            {founder.photo && (
              <>
                <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: p.paleTeal, top: -40, left: -60, zIndex: 0 }} />
                <div className="aa-photo-wrap" style={{ position: 'relative', zIndex: 1, width: 320, height: 380, boxShadow: '0 24px 64px rgba(0,77,77,0.15)', cursor: 'default' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={founder.photo} alt={founder.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', borderRadius: 24 }} />
                  <div className="aa-photo-overlay" style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'linear-gradient(to top, rgba(0,77,77,0.5) 0%, transparent 60%)', opacity: 0, transition: 'opacity 0.3s ease' }} />
                </div>
              </>
            )}
            {/* The panel held the years badge and the credentials. Emptied of both it was a dark
                teal bar sitting under the photograph, which is how it looked: a bug. */}
            <When any={[t('home.founder.years'), t('home.founder.credentials')]}>
            <div style={{ marginTop: founder.photo ? 28 : 0, background: p.deepTeal, borderRadius: 20, padding: '28px 32px', position: 'relative', zIndex: 1 }}>
              <When any={[t('home.founder.years')]}>
                <div style={{ position: 'absolute', top: 20, right: 20, background: p.orange, borderRadius: 12, padding: '10px 14px', textAlign: 'center', boxShadow: '0 4px 16px rgba(255,151,21,0.3)', minWidth: 72 }}>
                  <div style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 26, fontWeight: 400, lineHeight: 1 }}>{t('home.founder.years')}</div>
                  <div style={{ color: p.deepTeal, opacity: 0.85, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>years<br />experience</div>
                </div>
              </When>
              <When any={[t('home.founder.credentials')]}>
                <div style={{ color: p.lightTeal, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 2, background: p.orange }} />
                  Credentials
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {list(t('home.founder.credentials')).map((c) => (
                    <div key={c} className="aa-cred-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: p.orange, fontSize: 10, flexShrink: 0 }}>✦</span>
                      <span style={{ color: p.lightTeal, fontSize: 14, lineHeight: 1.4 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </When>
            </div>
            </When>
          </div>
          )}

          {/* RIGHT - text */}
          <div style={{ paddingTop: 40 }}>
            <Editable k="home.founder.eyebrow" label="the small line above the founder heading" as="div" block>
            <p style={{ color: p.deepTeal, fontSize: 28, fontWeight: 800, margin: '0 0 28px' }}>{t('home.founder.eyebrow')}</p>
            </Editable>
            <h2 style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 48, fontWeight: 400, lineHeight: 1.1, margin: '0 0 32px', letterSpacing: '-0.01em' }}>
              {/* Two lines, the second in italics. Splitting on the newline keeps that shape while
                  letting a site write its own words into it. */}
              {lines(t('home.founder.heading')).map((line, i) => (
                <Fragment key={line}>
                  {i > 0 && <br />}
                  {i === 0 ? line : <span style={{ fontStyle: 'italic' }}>{line}</span>}
                </Fragment>
              ))}
            </h2>
            <div style={{ width: 48, height: 3, background: p.orange, borderRadius: 2, marginBottom: 32 }} />
            <Editable k="home.founder.body" label="the founder introduction" as="div" block>
            <Prose text={t('home.founder.body')} style={{ color: p.body, fontSize: 17, lineHeight: 1.8, margin: '0 0 40px', maxWidth: 460 }} />
            </Editable>
            <When any={[t('home.founder.quote')]}>
              <div style={{ borderLeft: `3px solid ${p.orange}`, paddingLeft: 20, marginBottom: 44 }}>
                <p style={{ color: p.midTeal, fontSize: 15, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
                  &ldquo;{t('home.founder.quote')}&rdquo;
                </p>
              </div>
            </When>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <a href={bookingUrl} className="aa-cta-primary" style={{ background: p.orange, color: p.deepTeal, border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                {t('home.founder.bookCta')} <ArrowRight />
              </a>
              <Link href="/about" className="aa-cta-secondary" style={{ background: 'none', border: 'none', color: p.midTeal, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease', padding: 0, textDecoration: 'none' }}>
                {t('home.founder.cta')} <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
