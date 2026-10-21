import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { colors as p } from '@/theme/colors';
import { useCompanyName } from '@/hooks/useCompanyName';
import { SITE_URL } from '@/config/featureFlags';
import type { LegalPage } from './legalText';

// ============= A site's own legal pages =============
//
// The Terms, Privacy and Cookie pages carried one company's documents, and a second site could
// only show them or say it had not written its own. There was nowhere to write its own: the
// documents were in the code. Now each is a box on This Site, and the page renders what is in it.
//
// Plain text with three marks, because the person writing this is pasting from a solicitor's
// document or a template, not writing markup: a line starting "## " is a heading, a line starting
// "- " is a bullet, and a blank line starts a new paragraph.

const h2 = { color: p.deepTeal, fontSize: 20, fontWeight: 700 as const, marginTop: 40, marginBottom: 12 };
const para = { color: p.body, fontSize: 15, lineHeight: 1.75, marginBottom: 16 };

export function OwnLegal({ page, title, text }: { page: LegalPage; title: string; text: string }) {
  const companyName = useCompanyName();
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF', minHeight: '100vh' }}>
      <Helmet>
        <title>{`${title} - ${companyName}`}</title>
        <link rel="canonical" href={`${SITE_URL}/${page}`} />
      </Helmet>
      <Navigation />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px' }}>
        <h1 style={{ color: p.deepTeal, fontSize: 32, fontWeight: 800, marginBottom: 24 }}>{title}</h1>
        {/* No raw HTML: what is written here is shown as text, so a pasted document cannot carry a
            script or a form onto the site. */}
        <ReactMarkdown
          skipHtml
          components={{
            h1: ({ children }) => <h2 style={h2}>{children}</h2>,
            h2: ({ children }) => <h2 style={h2}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ ...h2, fontSize: 17, marginTop: 28 }}>{children}</h3>,
            p: ({ children }) => <p style={para}>{children}</p>,
            ul: ({ children }) => <ul style={{ paddingLeft: 24, marginBottom: 16 }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: 24, marginBottom: 16 }}>{children}</ol>,
            li: ({ children }) => <li style={{ ...para, marginBottom: 8 }}>{children}</li>,
            a: ({ href, children }) => <a href={href} style={{ color: p.deepTeal, textDecoration: 'underline' }}>{children}</a>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
      <Footer />
    </div>
  );
}
