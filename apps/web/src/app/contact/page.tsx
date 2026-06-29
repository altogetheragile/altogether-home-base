import type { Metadata } from 'next';
import { buildMetadata, JsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { ContactForm } from './ContactForm';

export const dynamic = 'force-dynamic';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };
const BOOKING_URL = 'https://calendly.com/alundaviesbaker/30min';
const CONTACT_EMAIL = 'info@altogetheragile.com';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Contact - Altogether Agile',
    description: 'Get in touch with Altogether Agile for coaching, training enquiries, or to book a free chemistry session.',
    path: '/contact',
  }),
  title: { absolute: 'Contact - Altogether Agile' },
};

const Mail = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z" /></svg>;
const MapPin = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" /></svg>;
const Calendar = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" /></svg>;

const cards = [
  { icon: <Mail />, title: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
  { icon: <MapPin />, title: 'Location', value: 'London, England', href: null, external: false },
  { icon: <Calendar />, title: 'Book a Call', value: 'Free 30-min chemistry session', href: BOOKING_URL, external: true },
];

export default function ContactPage() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }])} />

      <style>{`
        .aa-contact-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .aa-contact-wrap { padding: 56px 24px; }
        @media (max-width: 767px) { .aa-contact-cards { grid-template-columns: 1fr; } .aa-contact-wrap { padding: 40px 20px; } }
      `}</style>

      {/* HERO */}
      <div id="main-content" style={{ background: p.paleTeal, padding: '56px 24px', textAlign: 'center' }}>
        <h1 style={{ color: p.deepTeal, fontSize: 'clamp(30px, 5vw, 40px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.15 }}>Get in Touch</h1>
        <p style={{ color: p.body, fontSize: 16, lineHeight: 1.6, margin: '0 auto', maxWidth: 620 }}>Whether you have a question about our courses, want to discuss coaching, or just want to say hello - we&apos;d love to hear from you.</p>
      </div>

      {/* INFO CARDS */}
      <div className="aa-contact-wrap" style={{ background: '#fff' }}>
        <div className="aa-contact-cards" style={{ maxWidth: 1000, margin: '0 auto' }}>
          {cards.map((c) => {
            const inner = (
              <>
                <div style={{ color: p.orange, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{c.title}</div>
                <div style={{ color: p.body, fontSize: 14 }}>{c.value}</div>
              </>
            );
            const cardStyle: React.CSSProperties = { background: p.paleTeal, borderRadius: 14, padding: '28px 24px', textAlign: 'center', textDecoration: 'none', display: 'block' };
            return c.href ? (
              <a key={c.title} href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={cardStyle}>{inner}</a>
            ) : (
              <div key={c.title} style={cardStyle}>{inner}</div>
            );
          })}
        </div>
      </div>

      {/* FORM */}
      <div className="aa-contact-wrap" style={{ background: p.skyTeal }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
