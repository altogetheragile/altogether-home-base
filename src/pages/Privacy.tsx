import { colors as p } from '@/theme/colors';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, CONTACT_EMAIL } from '@/config/featureFlags';

const h1Style = { color: p.deepTeal, fontSize: 32, fontWeight: 800 as const, marginBottom: 8 };
const h2Style = { color: p.deepTeal, fontSize: 20, fontWeight: 700 as const, marginTop: 40, marginBottom: 12 };
const pStyle = { color: p.body, fontSize: 15, lineHeight: 1.75, marginBottom: 16 };
const liStyle = { color: p.body, fontSize: 15, lineHeight: 1.75, marginBottom: 8 };

const Privacy = () => (
  <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF', minHeight: '100vh' }}>
    <Helmet>
      <title>Privacy Notice — Altogether Agile</title>
      <link rel="canonical" href={`${SITE_URL}/privacy`} />
    </Helmet>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 48px' }}>
      <h1 style={h1Style}>Privacy Notice</h1>
      <p style={{ ...pStyle, color: p.muted, fontSize: 13 }}>Last updated: March 2026</p>

      <h2 style={h2Style}>1. Who We Are</h2>
      <p style={pStyle}>
        Altogether Agile Ltd ("we", "us", "our") is a company registered in England and Wales. We provide agile training, coaching, and consultancy services via this website. Our contact email for data protection enquiries is {CONTACT_EMAIL}.
      </p>

      <h2 style={h2Style}>2. What Data We Collect</h2>
      <p style={pStyle}>We may collect the following personal data:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={liStyle}><strong>Account information:</strong> name, email address, and password when you create an account.</li>
        <li style={liStyle}><strong>Contact form submissions:</strong> name, email, phone number, and message content when you contact us.</li>
        <li style={liStyle}><strong>Coaching enquiries:</strong> name, email, and details you provide about your coaching needs.</li>
        <li style={liStyle}><strong>Event bookings:</strong> name, email, and payment information when you register for a course or event.</li>
        <li style={liStyle}><strong>Usage data:</strong> pages visited, browser type, and IP address, collected automatically via cookies and analytics.</li>
      </ul>

      <h2 style={h2Style}>3. How We Use Your Data</h2>
      <p style={pStyle}>We use your personal data to:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={liStyle}>Provide and manage your account on this website.</li>
        <li style={liStyle}>Respond to contact form enquiries and coaching requests.</li>
        <li style={liStyle}>Process event bookings and send booking confirmations.</li>
        <li style={liStyle}>Send you information about courses and events you have expressed interest in, where you have given consent.</li>
        <li style={liStyle}>Improve our website and services based on usage patterns.</li>
      </ul>

      <h2 style={h2Style}>4. Legal Basis for Processing</h2>
      <p style={pStyle}>We process your data on the following legal bases:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={liStyle}><strong>Contract:</strong> to fulfil bookings and provide services you have purchased.</li>
        <li style={liStyle}><strong>Consent:</strong> for marketing communications and optional cookies.</li>
        <li style={liStyle}><strong>Legitimate interest:</strong> to respond to enquiries, improve our services, and maintain website security.</li>
      </ul>

      <h2 style={h2Style}>5. Data Sharing</h2>
      <p style={pStyle}>
        We do not sell your personal data. We may share data with the following third parties, solely to deliver our services:
      </p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={liStyle}><strong>Supabase:</strong> database hosting and authentication.</li>
        <li style={liStyle}><strong>Resend:</strong> transactional email delivery.</li>
        <li style={liStyle}><strong>Vercel:</strong> website hosting.</li>
        <li style={liStyle}><strong>Calendly:</strong> booking and scheduling.</li>
        <li style={liStyle}><strong>Certification bodies</strong> (e.g. APMG, Scrum Alliance) where required for course registration or examination.</li>
      </ul>

      <h2 style={h2Style}>6. Data Retention</h2>
      <p style={pStyle}>
        We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected. Contact form submissions are retained for up to 12 months. Account data is retained until you request deletion. Booking and payment records are retained for up to 7 years for legal and accounting purposes.
      </p>

      <h2 style={h2Style}>7. Your Rights</h2>
      <p style={pStyle}>Under UK data protection law, you have the right to:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        <li style={liStyle}>Access the personal data we hold about you.</li>
        <li style={liStyle}>Request correction of inaccurate data.</li>
        <li style={liStyle}>Request deletion of your data.</li>
        <li style={liStyle}>Object to or restrict processing of your data.</li>
        <li style={liStyle}>Withdraw consent at any time where processing is based on consent.</li>
        <li style={liStyle}>Lodge a complaint with the Information Commissioner's Office (ICO) at <span style={{ color: p.midTeal }}>ico.org.uk</span>.</li>
      </ul>
      <p style={pStyle}>
        To exercise any of these rights, please contact us at {CONTACT_EMAIL}.
      </p>

      <h2 style={h2Style}>8. Cookies</h2>
      <p style={pStyle}>
        For details on the cookies we use and how to manage them, please see our <a href="/cookies" style={{ color: p.midTeal, textDecoration: 'underline' }}>Cookie Policy</a>.
      </p>

      <h2 style={h2Style}>9. Security</h2>
      <p style={pStyle}>
        We take reasonable technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse. All data is transmitted over encrypted HTTPS connections. Authentication data is managed by Supabase with industry-standard security practices.
      </p>

      <h2 style={h2Style}>10. Changes to This Notice</h2>
      <p style={pStyle}>
        We may update this privacy notice from time to time. Any changes will be posted on this page with an updated "Last updated" date.
      </p>

      <h2 style={h2Style}>11. Contact</h2>
      <p style={pStyle}>
        {CONTACT_EMAIL}<br />
        Altogether Agile Ltd, London, England.
      </p>
    </div>
  </div>
);

export default Privacy;
