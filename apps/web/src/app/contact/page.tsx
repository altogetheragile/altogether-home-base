import type { Metadata } from 'next';
import { buildMetadata, JsonLd, breadcrumbJsonLd , siteName } from '@/lib/seo';
import { ContactForm } from './ContactForm';
import { getSiteSettings } from '@/lib/site-settings';
import { bookingHref } from '@/lib/booking';
import { colors as p } from '@/lib/brand';
import { requireModule } from '@/lib/module-gate';
import { getCopy } from '@/lib/copy';
import { pageCrumbs } from '@/lib/copy/pageName';

export const dynamic = 'force-dynamic';

const CONTACT_EMAIL = 'info@altogetheragile.com';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getCopy('contact');
  return {
  ...(await buildMetadata({
    title: `${t('contact.meta.titlePrefix')} - ${await siteName()}`,
    description: t('contact.meta.description'),
    path: '/contact',
  })),
  title: { absolute: `${t('contact.meta.titlePrefix')} - ${await siteName()}` },
  };
}

const Mail = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z" /></svg>;
const MapPin = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" /></svg>;
const Calendar = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" /></svg>;

// Built per request rather than at module scope: the booking href depends on the
// show_bookings setting, which is read at render.
const buildCards = (bookingUrl: string) => [
  { icon: <Mail />, title: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
  { icon: <MapPin />, title: 'Location', value: 'London, England', href: null, external: false },
  // Our own page now, so it opens in the same tab.
  { icon: <Calendar />, title: 'Book a Call', value: 'Free 30-min chemistry session', href: bookingUrl, external: false },
];

export default async function ContactPage() {
  await requireModule('contact');
  const [settings, t] = await Promise.all([getSiteSettings(), getCopy('contact')]);
  const cards = buildCards(bookingHref(settings.show_bookings));

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('contact', '/contact', 'Contact'))} />

      <style>{`
        .aa-contact-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .aa-contact-wrap { padding: 56px 24px; }
        @media (max-width: 767px) { .aa-contact-cards { grid-template-columns: 1fr; } .aa-contact-wrap { padding: 40px 20px; } }
      `}</style>

      {/* HERO */}
      <div id="main-content" style={{ background: p.paleTeal, padding: '56px 24px', textAlign: 'center' }}>
        <h1 style={{ color: p.deepTeal, fontSize: 'clamp(30px, 5vw, 40px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.15 }}>{t('contact.hero.heading')}</h1>
        <p style={{ color: p.body, fontSize: 16, lineHeight: 1.6, margin: '0 auto', maxWidth: 620 }}>{t('contact.hero.intro')}</p>
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
