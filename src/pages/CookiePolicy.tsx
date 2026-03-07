import { Helmet } from 'react-helmet-async';
import { SITE_URL, CONTACT_EMAIL } from '@/config/featureFlags';

const h1Style = { color: '#004D4D', fontSize: 32, fontWeight: 800 as const, marginBottom: 8 };
const h2Style = { color: '#004D4D', fontSize: 20, fontWeight: 700 as const, marginTop: 40, marginBottom: 12 };
const pStyle = { color: '#374151', fontSize: 15, lineHeight: 1.75, marginBottom: 16 };

const thStyle: React.CSSProperties = {
  background: '#F0FAFA',
  color: '#004D4D',
  fontSize: 13,
  fontWeight: 700,
  padding: '10px 14px',
  textAlign: 'left',
  border: '1px solid #D9F2F2',
};
const tdStyle: React.CSSProperties = {
  border: '1px solid #D9F2F2',
  padding: '10px 14px',
  fontSize: 14,
  color: '#374151',
};

const CookiePolicy = () => (
  <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF', minHeight: '100vh' }}>
    <Helmet>
      <title>Cookie Policy — Altogether Agile</title>
      <link rel="canonical" href={`${SITE_URL}/cookies`} />
    </Helmet>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 48px' }}>
      <h1 style={h1Style}>Altogether Agile Ltd — Cookie Policy</h1>
      <p style={{ ...pStyle, color: '#6B7280', fontSize: 13 }}>Last updated: March 2026</p>

      <h2 style={h2Style}>What are cookies?</h2>
      <p style={pStyle}>
        Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and understand how it is being used.
      </p>

      <h2 style={h2Style}>What cookies does this site use?</h2>
      <p style={pStyle}>
        This website uses only the cookies necessary for it to function. We do not use advertising cookies, tracking cookies, or any third-party analytics.
      </p>

      <h2 style={h2Style}>Essential cookies</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={thStyle}>Cookie</th>
            <th style={thStyle}>Purpose</th>
            <th style={thStyle}>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Supabase session</td>
            <td style={tdStyle}>Keeps you signed in to your account</td>
            <td style={tdStyle}>Session</td>
          </tr>
          <tr>
            <td style={tdStyle}>Stripe</td>
            <td style={tdStyle}>Processes payments securely</td>
            <td style={tdStyle}>Session</td>
          </tr>
        </tbody>
      </table>
      <p style={pStyle}>
        Supabase is used to manage user accounts and store course-related data. Stripe is used to process payments and may set its own cookies during checkout.
      </p>

      <h2 style={h2Style}>Analytics</h2>
      <p style={pStyle}>
        We do not currently use Google Analytics or any other analytics tool. If we add analytics in future, this policy will be updated and appropriate consent will be sought.
      </p>

      <h2 style={h2Style}>Do I need to accept cookies?</h2>
      <p style={pStyle}>
        Because we only use essential cookies, no consent banner is required. These cookies are placed automatically as they are strictly necessary for the site to function.
      </p>

      <h2 style={h2Style}>How to manage cookies</h2>
      <p style={pStyle}>
        You can control or delete cookies using your browser settings. Note that disabling essential cookies may prevent parts of the site from working.
      </p>

      <h2 style={h2Style}>Contact</h2>
      <p style={pStyle}>
        {CONTACT_EMAIL}
      </p>
    </div>
  </div>
);

export default CookiePolicy;
