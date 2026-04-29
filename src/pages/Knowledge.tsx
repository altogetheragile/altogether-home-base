import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ISACanvas from '@/components/knowledge/ISACanvas';
import { useIsMobile } from '@/hooks/use-mobile';
import { colors as p } from '@/theme/colors';

// ─── Phosphor-style bold SVG icons ─────────────────────────────────────────
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
  Chat: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
    </svg>
  ),
};

const Knowledge: React.FC = () => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <Helmet>
        <title>Knowledge Base — Altogether Agile</title>
        <meta name="description" content="Explore the Agile Business Architecture Flow — artifacts organised by Value Horizon and ISA dimension. A visual reference for agile practitioners." />
        <meta property="og:title" content="Knowledge Base — Altogether Agile" />
        <meta property="og:description" content="Explore the Agile Business Architecture Flow — artifacts organised by Value Horizon and ISA dimension." />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <link rel="canonical" href={`${SITE_URL}/knowledge`} />
      </Helmet>

      <Navigation />

      {/* ─── PAGE INTRO ─── */}
      <div id="main-content" style={{ background: '#006666', padding: isMobile ? '40px 20px 32px' : '64px 48px 48px' }}>
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
          flexDirection: isMobile ? 'column' : undefined,
          gap: isMobile ? 24 : 64,
          alignItems: 'end',
        }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Knowledge Base</div>
            <h1 style={{ color: '#fff', fontSize: isMobile ? 32 : 46, fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
              Agile Business<br />Architecture Flow
            </h1>
            <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              Artifacts organised by Value Horizon and ISA dimension. Intent cascades inward. Evidence flows outward. Click any artifact to explore what it is, when to use it, and how it connects.
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
                placeholder="Search artifacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '13px 16px 13px 42px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { n: '3', label: 'Horizons' },
                { n: '4', label: 'ISA Dimensions' },
                { n: '30', label: 'Artifacts' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ color: p.orange, fontSize: 22, fontWeight: 800 }}>{s.n}</div>
                  <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ISA CANVAS ─── */}
      <div style={{ background: '#EEF1EC', padding: isMobile ? '24px 12px' : '32px 20px' }}>
        <ISACanvas searchTerm={search} />
      </div>

      {/* ─── CTA BAND ─── */}
      <div style={{ background: '#006666', padding: isMobile ? '40px 20px' : '56px 48px' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 40, alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Go Deeper</div>
            <h2 style={{ color: '#fff', fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>Want to use these artifacts with your team?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              Altogether Agile runs hands-on workshops and certification courses built around these techniques — with real scenarios, not toy examples.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Link to="/events" style={{ background: p.orange, color: p.deepTeal, border: 'none', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', textDecoration: 'none' }}>
              Browse Events <Icons.ArrowRight />
            </Link>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: 'none', padding: 0, color: p.lightTeal, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', textDecoration: 'none' }}>
              <Icons.Chat />Book a Chemistry Session
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Knowledge;
