import { colors as p } from '@/theme/colors';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, CONTACT_EMAIL } from '@/config/featureFlags';

const h1Style = { color: p.deepTeal, fontSize: 32, fontWeight: 800 as const, marginBottom: 8 };
const pStyle = { color: p.body, fontSize: 15, lineHeight: 1.75, marginBottom: 16 };

const Privacy = () => (
  <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF', minHeight: '100vh' }}>
    <Helmet>
      <title>Privacy Notice — Altogether Agile</title>
      <link rel="canonical" href={`${SITE_URL}/privacy`} />
    </Helmet>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 48px' }}>
      <h1 style={h1Style}>Privacy Notice</h1>
      <p style={{ ...pStyle, color: p.muted, fontSize: 13 }}>Last updated: March 2026</p>

      <p style={pStyle}>
        Our full privacy notice is being finalised and will be published here shortly.
      </p>
      <p style={pStyle}>
        In the meantime, if you have any questions about how Altogether Agile Ltd handles your personal data, please contact us at {CONTACT_EMAIL}.
      </p>
      <p style={pStyle}>
        Altogether Agile Ltd is registered with the Information Commissioner's Office (ICO). You have the right to access, correct, or request deletion of any personal data we hold about you.
      </p>
    </div>
  </div>
);

export default Privacy;
