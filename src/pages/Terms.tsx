import { Helmet } from 'react-helmet-async';
import { SITE_URL, CONTACT_EMAIL } from '@/config/featureFlags';

const h1Style = { color: '#004D4D', fontSize: 32, fontWeight: 800 as const, marginBottom: 8 };
const h2Style = { color: '#004D4D', fontSize: 20, fontWeight: 700 as const, marginTop: 40, marginBottom: 12 };
const h3Style = { color: '#004D4D', fontSize: 16, fontWeight: 700 as const, marginTop: 24, marginBottom: 8 };
const pStyle = { color: '#374151', fontSize: 15, lineHeight: 1.75, marginBottom: 16 };

const Terms = () => (
  <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF', minHeight: '100vh' }}>
    <Helmet>
      <title>Terms and Conditions — Altogether Agile</title>
      <link rel="canonical" href={`${SITE_URL}/terms`} />
    </Helmet>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 48px' }}>
      <h1 style={h1Style}>Altogether Agile Ltd — Terms and Conditions</h1>
      <p style={{ ...pStyle, color: '#6B7280', fontSize: 13 }}>Last updated: March 2026</p>

      <h2 style={h2Style}>1. About Us</h2>
      <p style={pStyle}>
        Altogether Agile Ltd is a company registered in England and Wales. Our registered office is in London, England. We provide agile training, coaching, facilitation, and access to a library of agile techniques and resources (the "Knowledge Base") via this website.
      </p>
      <p style={pStyle}>
        References to "we", "us", or "our" mean Altogether Agile Ltd. References to "you" mean the individual accessing this website or purchasing our services.
      </p>

      <h2 style={h2Style}>2. Scope</h2>
      <p style={pStyle}>
        These Terms and Conditions apply to: use of this website; purchase of or registration for any course, workshop, or event; access to the Knowledge Base; and any coaching or consultancy services arranged via this website.
      </p>
      <p style={pStyle}>
        By using this website or purchasing our services, you agree to these terms.
      </p>

      <h2 style={h2Style}>3. Courses and Events</h2>

      <h3 style={h3Style}>3.1 Booking</h3>
      <p style={pStyle}>
        A booking is confirmed when you receive a written confirmation from us by email. We reserve the right to decline a booking at our discretion.
      </p>

      <h3 style={h3Style}>3.2 Pricing</h3>
      <p style={pStyle}>
        All prices are shown in pounds sterling (GBP) and are inclusive of VAT where applicable. The price at the time of confirmed booking will apply to your order.
      </p>

      <h3 style={h3Style}>3.3 Cancellation by You</h3>
      <p style={pStyle}>
        More than 14 days before the event: full refund. 7 to 14 days before the event: 50% refund. Less than 7 days before the event: no refund. You may transfer your booking to another person at no extra charge, provided you notify us at least 48 hours before the event.
      </p>

      <h3 style={h3Style}>3.4 Cancellation by Us</h3>
      <p style={pStyle}>
        We reserve the right to cancel or reschedule a course or event at any time. If we cancel, you will receive a full refund. If we reschedule, you may accept the new date or request a full refund. We are not liable for any travel, accommodation, or other costs you may have incurred.
      </p>

      <h3 style={h3Style}>3.5 Course Delivery</h3>
      <p style={pStyle}>
        Our courses are delivered personally by Alun Davies-Baker unless otherwise stated. We reserve the right to substitute an equally qualified trainer in exceptional circumstances.
      </p>

      <h3 style={h3Style}>3.6 Framework-Based Courses</h3>
      <p style={pStyle}>
        Some of our courses are based on published frameworks including AgilePM, AgileBA, Kanban, and ABC Scrum Master. These courses are delivered based on the relevant framework content. They do not currently include a formal examination or certification component. If you require a certified examination, you will need to arrange this separately.
      </p>

      <h2 style={h2Style}>4. Coaching Services</h2>
      <p style={pStyle}>
        Coaching sessions are subject to a separate coaching agreement provided before sessions begin. The cancellation policy in clause 3.3 applies to individual sessions. A chemistry session (initial free conversation) may be cancelled at any time without charge.
      </p>

      <h2 style={h2Style}>5. Knowledge Base</h2>

      <h3 style={h3Style}>5.1 Access</h3>
      <p style={pStyle}>
        Registered users may access the Knowledge Base in accordance with these terms. We reserve the right to modify, remove, or restrict access to content at any time.
      </p>

      <h3 style={h3Style}>5.2 Intellectual Property</h3>
      <p style={pStyle}>
        All content in the Knowledge Base is the intellectual property of Altogether Agile Ltd unless otherwise attributed. You may not reproduce, republish, distribute, or commercially exploit any Knowledge Base content without our express written permission. You may print or save individual pages for your own personal, non-commercial use.
      </p>

      <h2 style={h2Style}>6. Website Use</h2>
      <p style={pStyle}>
        You agree not to use this website in any way that is unlawful, harmful, or disruptive. We make reasonable efforts to keep this website available and accurate, but we do not guarantee that it will be uninterrupted or error-free.
      </p>

      <h2 style={h2Style}>7. Limitation of Liability</h2>
      <p style={pStyle}>
        To the fullest extent permitted by law, Altogether Agile Ltd shall not be liable for any indirect, incidental, or consequential loss arising from your use of this website or our services. Our total liability shall not exceed the amount you paid for the relevant services. Nothing in these terms limits our liability for death or personal injury caused by our negligence, or for fraud.
      </p>

      <h2 style={h2Style}>8. Privacy</h2>
      <p style={pStyle}>
        Your use of this website is subject to our Privacy Policy.
      </p>

      <h2 style={h2Style}>9. Governing Law</h2>
      <p style={pStyle}>
        These terms are governed by the laws of England and Wales.
      </p>

      <h2 style={h2Style}>10. Changes to These Terms</h2>
      <p style={pStyle}>
        We may update these terms from time to time. Continued use of our services after any changes constitutes your acceptance of the updated terms.
      </p>

      <h2 style={h2Style}>11. Contact</h2>
      <p style={pStyle}>
        {CONTACT_EMAIL}<br />
        Altogether Agile Ltd, London, England.
      </p>
    </div>
  </div>
);

export default Terms;
