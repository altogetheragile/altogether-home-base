import { Helmet } from 'react-helmet-async';
import { AppLink } from '@/components/AppLink';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { colors as p } from '@/theme/colors';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// ============= A site that has not written its terms yet =============
//
// The Terms, Privacy and Cookie pages carry one company's legal documents: a registration number,
// a registered office, liability wording drafted for one business. A second site built from this
// repository published all of it under its own domain.
//
// The route stays reachable, because modulesAreReal.test.ts is right that a site nobody can read
// the terms of is not a configuration anyone wants. What changes is what it says. A page that
// admits it is unwritten is honest; a page presenting somebody else's liability terms as yours is
// not, and it looks deliberate.
//
// `show_legal` is false by default, so a new database gets this. altogetheragile.com sets it true.

/** Whether this site publishes its own legal pages. */
export function usePublishesLegal(): boolean {
  const { settings } = useSiteSettings();
  return (settings as { show_legal?: boolean | null } | undefined)?.show_legal === true;
}

export function UnpublishedLegal({ title }: { title: string }) {
  const companyName = useCompanyName();
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF', minHeight: '100vh' }}>
      <Helmet>
        <title>{`${title} - ${companyName}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navigation />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px 120px' }}>
        <h1 style={{ color: p.deepTeal, fontSize: 30, fontWeight: 800, marginBottom: 14 }}>{title}</h1>
        <p style={{ color: p.body, fontSize: 16, lineHeight: 1.8, marginBottom: 18 }}>
          {companyName} has not published this page yet.
        </p>
        <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
          These are legal documents specific to a business, so they are written rather than
          inherited. If you need them before they are here, please get in touch.
        </p>
        <AppLink to="/contact" style={{ background: p.orange, color: '#fff', padding: '12px 22px', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
          Contact us
        </AppLink>
      </div>
      <Footer />
    </div>
  );
}
