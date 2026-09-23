import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLink } from '@/components/AppLink';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { colors as p } from '@/theme/colors';
import { useSiteSettings } from '@/hooks/useSiteSettings';


const NotFound: React.FC = () => {
  const location = useLocation();
  // A 404 is the one page in this app a stranger reaches, so it is the one tab title that must
  // not say somebody else's company name.
  const { settings } = useSiteSettings();
  const companyName = (settings as { company_name?: string | null } | undefined)?.company_name ?? 'Altogether Agile';

  useEffect(() => {}, [location.pathname]);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF' }}>
      <Helmet>
        <title>{`Page Not Found - ${companyName}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* ─── NAV ─── */}
      <Navigation />

      {/* ─── 404 CONTENT ─── */}
      <div style={{ minHeight: 'calc(100vh - 64px - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', background: p.paleTeal }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ color: p.orange, fontWeight: 800, fontSize: 96, lineHeight: 1, marginBottom: 16 }}>404</div>
          <h1 style={{ color: p.deepTeal, fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Page not found</h1>
          <p style={{ color: p.body, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <AppLink to="/" style={{ background: p.orange, color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>
              Go Home
            </AppLink>
            <AppLink to="/events" style={{ background: 'transparent', color: p.deepTeal, border: `2px solid ${p.deepTeal}`, padding: '11px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>
              Browse Events
            </AppLink>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
};

export default NotFound;
