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
const Phone = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46ZM176,208A128.14,128.14,0,0,1,48,80,40.2,40.2,0,0,1,82.87,40a.61.61,0,0,0,0,.12l21,47L83.2,111.86a6.13,6.13,0,0,0-.57.77,16,16,0,0,0-1,15.7c9.06,18.53,27.73,37.06,46.46,46.11a16,16,0,0,0,15.75-1.14,8,8,0,0,0,.74-.56L168.89,152l47,21.05h0s.08,0,.11,0A40.21,40.21,0,0,1,176,208Z" /></svg>;
const Calendar = () => <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" /></svg>;

/** The cards above the form, from this site's own details.
 *
 *  These were three constants: this repository's own email address, the city it is run from, and
 *  a description of a call. The footer had been reading contact_email from site_settings all
 *  along, so a second site showed its own address at the bottom of the page and this one's at the
 *  top, on the page whose whole purpose is telling somebody how to reach you.
 *
 *  A card with nothing to show is left out rather than shown empty. A site with no phone number
 *  should have no phone card, not a card saying Phone and nothing else. */
const buildCards = (
  settings: { contact_email?: string | null; contact_phone?: string | null; contact_location?: string | null },
  t: (key: string) => string,
  bookingUrl: string,
) => [
  { icon: <Mail />, title: t('contact.cards.email'), value: settings.contact_email?.trim(), href: (v: string) => `mailto:${v}` },
  { icon: <Phone />, title: t('contact.cards.phone'), value: settings.contact_phone?.trim(), href: (v: string) => `tel:${v.replace(/[^\d+]/g, '')}` },
  { icon: <MapPin />, title: t('contact.cards.location'), value: settings.contact_location?.trim(), href: null },
  // Our own page now, so it opens in the same tab.
  { icon: <Calendar />, title: t('contact.cards.booking'), value: t('contact.cards.bookingNote'), href: () => bookingUrl },
].flatMap((c) => (c.value ? [{ ...c, value: c.value, href: c.href ? c.href(c.value) : null }] : []));

export default async function ContactPage() {
  await requireModule('contact');
  const [settings, t] = await Promise.all([getSiteSettings(), getCopy('contact')]);
  const cards = buildCards(settings, t, bookingHref(settings.show_bookings));

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('contact', '/contact', 'Contact'))} />

      <style>{`
        .aa-contact-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
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
              // Every card links somewhere on this site or to a mailto/tel, so none opens a new
              // tab. The booking page used to be Calendly, which is where target="_blank" came in.
              <a key={c.title} href={c.href} style={cardStyle}>{inner}</a>
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
