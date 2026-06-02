import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { colors as p } from '@/theme/colors';
import { SITE_URL } from '@/config/featureFlags';

interface Crumb {
  label: string;
  to?: string;
}

interface KnowledgeBaseLayoutProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  crumbs?: Crumb[];
  children: ReactNode;
}

const SUBNAV = [
  { label: 'Map', to: '/knowledge-base' },
  { label: 'Lattice', to: '/knowledge-base/lattice' },
  { label: 'Techniques', to: '/knowledge-base/techniques' },
  { label: 'Pattern Builder', to: '/knowledge-base/pattern-builder' },
];

export function KnowledgeBaseLayout({
  title,
  description,
  canonicalPath,
  crumbs = [],
  children,
}: KnowledgeBaseLayoutProps) {
  const location = useLocation();
  const isActive = (to: string) =>
    to === '/knowledge-base'
      ? location.pathname === '/knowledge-base'
      : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: p.white }}>
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {canonicalPath && <link rel="canonical" href={`${SITE_URL}${canonicalPath}`} />}
      </Helmet>

      <Navigation />

      <main id="main-content" className="flex-grow">
        {/* Sub-nav */}
        <div style={{ background: p.skyTeal, borderBottom: `1px solid ${p.paleTeal}` }}>
          <div className="max-w-6xl mx-auto px-5 flex items-center gap-1 h-12">
            {SUBNAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors"
                style={{
                  color: isActive(item.to) ? p.white : p.deepTeal,
                  background: isActive(item.to) ? p.deepTeal : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Breadcrumb */}
        {crumbs.length > 0 && (
          <div className="max-w-6xl mx-auto px-5 pt-5">
            <nav className="text-xs" style={{ color: p.muted }}>
              {crumbs.map((c, i) => (
                <span key={i}>
                  {c.to ? (
                    <Link to={c.to} style={{ color: p.midTeal }}>
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && <span className="mx-1.5">/</span>}
                </span>
              ))}
            </nav>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-5 py-6">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
