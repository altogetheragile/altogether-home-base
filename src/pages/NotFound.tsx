import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';

const p = {
  deepTeal: '#004D4D',
  midTeal: '#007A7A',
  lightTeal: '#D9F2F2',
  paleTeal: '#F0FAFA',
  orange: '#FF9715',
  text: '#374151',
  textLight: '#B2DFDF',
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const ResponsiveStyles = () => (
  <style>{`
    .aa-nav-links { display: flex; }
    .aa-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
    .aa-hamburger { display: none; }
    @media (max-width: 767px) {
      .aa-hamburger { display: block !important; }
      .aa-nav-links { display: none; }
      .aa-footer-grid { grid-template-columns: 1fr; gap: 32px; }
    }
  `}</style>
);

const LogoFull = ({ height = 48, light = false }: { height?: number; light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
    <span style={{ color: light ? '#fff' : p.deepTeal, fontWeight: 800, fontSize: height * 0.48, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Altogether</span>
    <span style={{ color: p.orange, fontWeight: 800, fontSize: height * 0.48, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Agile</span>
  </div>
);

const NAV_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Knowledge Base', to: '/knowledge' },
  { label: 'Coaching', to: '/coaching' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const NotFound: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF' }}>
      <Helmet>
        <title>Page Not Found — Altogether Agile</title>
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <nav style={{ background: '#FFFFFF', borderBottom: `1px solid ${p.lightTeal}`, padding: isMobile ? '0 20px' : '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/"><LogoFull height={38} /></Link>
        <div className="aa-nav-links" style={{ gap: 32 }}>
          {NAV_LINKS.map((item) => (
            <Link key={item.label} to={item.to} style={{ color: p.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>{item.label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <Link to="/dashboard" style={{ background: p.orange, color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>Dashboard</Link>
          ) : (
            <Link to="/auth" style={{ background: p.orange, color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>Sign In</Link>
          )}
          <button className="aa-hamburger" onClick={() => setMenuOpen((v) => !v)} style={{ background: 'none', border: 'none', color: p.deepTeal, fontSize: 24, cursor: 'pointer', padding: 4, lineHeight: 1 }} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ background: '#FFFFFF', borderBottom: `1px solid ${p.lightTeal}`, position: 'sticky', top: 64, zIndex: 99 }}>
          {NAV_LINKS.map((item, i) => (
            <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '14px 20px', color: p.text, fontSize: 15, fontWeight: 500, textDecoration: 'none', borderBottom: i < NAV_LINKS.length - 1 ? `1px solid ${p.lightTeal}` : 'none' }}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* ─── 404 CONTENT ─── */}
      <div style={{ minHeight: 'calc(100vh - 64px - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', background: p.paleTeal }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ color: p.orange, fontWeight: 800, fontSize: 96, lineHeight: 1, marginBottom: 16 }}>404</div>
          <h1 style={{ color: p.deepTeal, fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Page not found</h1>
          <p style={{ color: p.text, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{ background: p.orange, color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>
              Go Home
            </Link>
            <Link to="/events" style={{ background: 'transparent', color: p.deepTeal, border: `2px solid ${p.deepTeal}`, padding: '11px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>
              Browse Events
            </Link>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ background: p.deepTeal, padding: '48px 20px 32px' }}>
        <div className="aa-footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}><LogoFull height={40} light /></div>
            <div style={{ color: p.textLight, fontSize: 14, lineHeight: 1.75, maxWidth: 300 }}>
              Agile training, coaching and facilitation — grounded in 25 years of real experience. Based in London, working everywhere.
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Links</div>
            {[
              { label: 'Events', to: '/events' },
              { label: 'Knowledge Base', to: '/knowledge' },
              { label: 'Coaching', to: '/coaching' },
              { label: 'About', to: '/about' },
              { label: 'Contact', to: '/contact' },
            ].map((link) => (
              <Link key={link.label} to={link.to} style={{ display: 'block', color: p.textLight, fontSize: 13, marginBottom: 8, cursor: 'pointer', textDecoration: 'none' }}>{link.label}</Link>
            ))}
            <Link to="/testimonials" style={{ display: 'block', color: p.textLight, fontSize: 13, marginBottom: 8, cursor: 'pointer', textDecoration: 'none' }}>Testimonials</Link>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get in Touch</div>
            <div style={{ color: p.textLight, fontSize: 13, marginBottom: 8 }}>info@altogetheragile.com</div>
            <div style={{ color: p.textLight, fontSize: 13 }}>London, England</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, color: p.textLight, fontSize: 12, textAlign: 'center' }}>
          &copy; 2026 Altogether Agile. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default NotFound;
