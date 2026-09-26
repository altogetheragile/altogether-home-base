import { Fragment } from 'react';
import { Editable } from '@/components/edit/Editable';
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import { bookingHref } from '@/lib/booking';
import { getHomeTestimonials } from '@/lib/home';
import { buildMetadata, JsonLd, breadcrumbJsonLd, SITE_URL, SITE_NAME , siteName } from '@/lib/seo';
import { HomeTestimonials } from '../HomeTestimonials';
import { CoachingEnquiryForm } from './CoachingEnquiryForm';
import { colors as p, fonts } from '@/lib/brand';
import { requireModule } from '@/lib/module-gate';
import { getCopy, lines, list, items, picture } from '@/lib/copy';
import { pageCrumbs } from '@/lib/copy/pageName';
import { Icon } from '@/components/icons/Icon';
import { tint } from '@altogether/ui/brand';
import { Prose } from '@/lib/copy/Prose';

export const dynamic = 'force-dynamic';


export async function generateMetadata(): Promise<Metadata> {
  const t = await getCopy('coaching');
  return {
  ...(await buildMetadata({
    title: `${t('coaching.meta.titlePrefix')} - ${await siteName()}`,
    description: t('coaching.meta.description'),
    path: '/coaching',
  })),
  title: { absolute: `${t('coaching.meta.titlePrefix')} - ${await siteName()}` },
  };
}

const ArrowRight = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" /></svg>;
const Chat = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z" /></svg>;
const CheckCircle = () => <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" /></svg>;
const User = () => <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220ZM128,144a56,56,0,1,0-56-56A56.06,56.06,0,0,0,128,144Z" /></svg>;
const Users = () => <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z" /></svg>;
const Calendar = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" /></svg>;

const Heading = ({ label, title, light = false }: { label: string; title: string; light?: boolean }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ color: light ? p.lightTeal : p.orange, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <h2 style={{ color: light ? '#fff' : p.deepTeal, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h2>
  </div>
);

// The colours a service falls back to when it has not chosen one, by position down the page.
//
// Not a list of services any more. There used to be exactly two, here in code, with nine copy
// keys each named after their position: adding a third was a code change, and the second one's
// words lived under `coaching.service.2.*` whatever it was actually about.
const serviceColours = ['#1A9090', '#6B5FCC', '#C2703D', '#3D7BC2'];

function Illustration({ src, alt, height }: { src: string; alt: string; height: number }) {
  // The zoom and focus point used to be set per picture, tuned by hand for the two illustrations
  // this page shipped with. A service somebody adds themselves has no such tuning and no way to
  // ask for it, so the framing has to be one that works for any picture: fill the box, keep the
  // middle. Both shipped illustrations are drawn with margin around them and are unaffected.
  return (
    <div className="aa-service-picture" style={{ borderRadius: 16, overflow: 'hidden', height, position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
    </div>
  );
}

export default async function CoachingPage() {
  await requireModule('coaching');
  const [settings, testimonials, t] = await Promise.all([getSiteSettings(), getHomeTestimonials(), getCopy('coaching')]);

  // As many services as there are, in the order they are written. A service with no name is a
  // row somebody is part way through typing, and is left off rather than rendered half-built.
  type Service = {
    title: string; label: string; tagline: string; description: string; detail: string;
    includes: string; price: string; packageNote: string; cta: string;
    icon: string; colour: string; image: string;
  };
  const services = items<Service>(t('coaching.services'), ['title']).map((s, i) => {
    const colour = s.colour?.trim() || serviceColours[i % serviceColours.length];
    return {
      ...s,
      colour,
      // The pale panel behind "What's included" is the accent colour, lightened. Derived rather
      // than a second box to fill in, because two colours that have to agree are two colours that
      // eventually will not.
      lightBg: tint(colour),
      includes: list(s.includes ?? ''),
      picture: picture(s.image ?? ''),
    };
  });
  const credentials = items<{ label: string; desc: string }>(t('coaching.why.items'), ['label']);
  const firstNameOnly = settings.show_testimonial_first_name_only ?? false;
  const bookingUrl = bookingHref(settings.show_bookings);

  return (
    <div style={{ fontFamily: fonts.sans, background: p.white }}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Agile Coaching', name: 'Agile Coaching and One-to-One Coaching', description: 'Professional one-to-one coaching and agile team coaching using an ICF-aligned approach, drawing on 25 years of hands-on experience.', url: `${SITE_URL}/coaching`, provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }, areaServed: ['London', 'United Kingdom'] }} />
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('coaching', '/coaching', 'Coaching'))} />

      <style>{`
        .aa-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
        /* Centred and capped. Without a maximum the band is as wide as the window, so on a
           large screen the body text ran to 928px - about 110 characters a line, well past
           comfortable - while the picture stayed 360px and sat marooned at the top of a row half
           again as tall as it was. The page already caps its hero at 680 and its form at 600;
           this brings the rest into line. */
        .aa-service-layout { display: grid; grid-template-columns: minmax(0, 1fr) clamp(300px, 35%, 440px); gap: 56px; align-items: center; max-width: 1200px; margin: 0 auto; }
        .aa-creds-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .aa-section-pad { padding: 64px 48px; }
        .aa-coach-hero { padding: 72px 48px 60px; }
        .aa-coach-band { padding: 56px 48px; }
        /* Stacked well before the phone breakpoint. Two columns need room for both: at tablet
           width the picture kept its 360px and the words were squeezed to 262, four or five to a
           line. Set at 1000 rather than 900 by looking at both: at 1024 the words still read
           properly beside the picture, and at 900 they do not. Below this the picture goes under
           the words at full width. */
        @media (max-width: 999px) {
          .aa-service-layout { grid-template-columns: 1fr; gap: 32px; }
          /* Capped and centred once it is under the words rather than beside them. Left to run
             the full width of the band it became a 2.2:1 letterbox and the crop took the tops of
             people's heads off. */
          .aa-service-picture { max-width: 520px; width: 100%; margin: 0 auto; }
        }
        @media (max-width: 767px) {
          .aa-two-col { grid-template-columns: 1fr; gap: 24px; }
          .aa-creds-grid { grid-template-columns: 1fr 1fr; }
          .aa-section-pad { padding: 40px 20px; }
          .aa-coach-hero { padding: 48px 20px 40px; }
          .aa-coach-band { padding: 40px 20px; }
          .aa-service-flip { direction: ltr !important; }
        }
      `}</style>

      {/* HERO */}
      <div id="main-content" className="aa-coach-hero" style={{ background: p.heroTeal }}>
        <div style={{ maxWidth: 680 }}>
          <Editable k="coaching.hero.eyebrow" label="this text" as="div" block>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>{t('coaching.hero.eyebrow')}</div>
          </Editable>
          <h1 style={{ color: '#fff', fontSize: 'clamp(34px, 5vw, 50px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px' }}>{lines(t('coaching.hero.heading')).map((l, i) => (<Fragment key={l}>{i > 0 && <br />}{l}</Fragment>))}</h1>
          <Prose k="coaching.hero.intro" text={t('coaching.hero.intro')} style={{ color: p.lightTeal, fontSize: 17, lineHeight: 1.75, margin: '0 0 32px', maxWidth: 540 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <a href={bookingUrl} style={{ background: p.orange, color: p.deepTeal, padding: '13px 26px', borderRadius: 10, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><Chat />{t('coaching.hero.cta')}</a>
            <a href="#enquiry" style={{ color: p.lightTeal, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>{t('coaching.hero.jump')} <ArrowRight /></a>
          </div>
        </div>
      </div>

      {/* WHAT COACHING IS */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div className="aa-service-layout">
          <div>
            <Heading label={t('coaching.approach.label')} title={t('coaching.approach.heading')} />
            <Editable k="coaching.approach.p1" label="this text" as="div" block>
              <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>{t('coaching.approach.p1')}</p>
            </Editable>
            <Editable k="coaching.approach.p2" label="this text" as="div" block>
              <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>{t('coaching.approach.p2')}</p>
            </Editable>
            <Prose k="coaching.approach.p3" text={t('coaching.approach.p3')} style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: 0 }} />
          </div>
          <Illustration src="/images/coaching-hero.webp" alt="Two people having a coaching conversation" height={320} />
        </div>
      </div>

      {/* SERVICES */}
      {services.map((service, si) => (
        <div key={service.title} className="aa-section-pad" style={{ background: si % 2 === 0 ? p.white : p.skyTeal }}>
          <div className="aa-service-layout aa-service-flip" style={{ direction: si % 2 === 1 ? 'rtl' : 'ltr' }}>
            <div style={{ direction: 'ltr' }}>
              {service.label?.trim() && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: service.lightBg, color: service.colour, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
                  <Icon name={service.icon} size={14} />{service.label}
                </div>
              )}
              <h2 style={{ color: p.deepTeal, fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>{service.title}</h2>
              <div style={{ color: service.colour, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>{service.tagline}</div>
              <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 14px' }}>{service.description}</p>
              <Prose text={service.detail} style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 28px' }} />
              <div style={{ background: service.lightBg, borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
                <Editable k="coaching.service.includesHeading" label="this text" as="div" block>
                  <div style={{ color: service.colour, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>{t('coaching.service.includesHeading')}</div>
                </Editable>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {service.includes.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: p.body, fontSize: 14, lineHeight: 1.6 }}>
                      <span style={{ color: service.colour, flexShrink: 0, marginTop: 1 }}><CheckCircle /></span>{item}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: p.deepTeal, fontSize: 20, fontWeight: 800 }}>{service.price}</div>
                  <div style={{ color: p.muted, fontSize: 12, marginTop: 2 }}>{service.packageNote}</div>
                </div>
                <a href="#enquiry" style={{ background: p.orange, color: p.deepTeal, padding: '13px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><Chat />{service.cta}</a>
              </div>
            </div>
            <div style={{ direction: 'ltr' }}>
              {service.picture && <Illustration src={service.picture.src} alt={service.picture.alt} height={360} />}
            </div>
          </div>
        </div>
      ))}

      {/* CREDENTIALS */}
      <div className="aa-section-pad" style={{ background: p.heroTeal }}>
        <Heading label={t('coaching.why.label')} title={t('coaching.why.heading')} light />
        <div className="aa-creds-grid">
          {credentials.map((cred) => (
            <div key={cred.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 20px 24px' }}>
              <div style={{ color: p.orange, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{cred.label}</div>
              <div style={{ color: p.lightTeal, fontSize: 13, lineHeight: 1.65 }}>{cred.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <HomeTestimonials items={testimonials} firstNameOnly={firstNameOnly} />

      {/* CHEMISTRY SESSION */}
      <div className="aa-coach-band" style={{ background: p.deepTeal }}>
        <div className="aa-two-col" style={{ alignItems: 'center' }}>
          <div>
            <Editable k="coaching.chemistry.label" label="this text" as="div" block>
              <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{t('coaching.chemistry.label')}</div>
            </Editable>
            <Editable k="coaching.chemistry.heading" label="this text" as="div" block>
              <Editable k="coaching.chemistry.heading" label="this text" as="div" block>
                <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>{t('coaching.chemistry.heading')}</h2>
              </Editable>
            </Editable>
            <Editable k="coaching.chemistry.body" label="this text" as="div" block>
              <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.75, margin: '0 0 24px' }}>{t('coaching.chemistry.body')}</p>
            </Editable>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['30 minutes', 'No commitment', 'Video or phone', 'Free'].map((tag) => (
                <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', color: p.lightTeal, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '32px 28px' }}>
            <Editable k="coaching.chemistry.boxHeading" label="this text" as="div" block>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>{t('coaching.chemistry.boxHeading')}</div>
            </Editable>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={bookingUrl} style={{ background: p.orange, color: p.deepTeal, padding: '14px 20px', borderRadius: 10, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}><Calendar />{t('coaching.chemistry.cta')}</a>
              <Editable k="coaching.chemistry.orForm" label="this text" as="div" block>
                <div style={{ color: p.lightTeal, fontSize: 12, textAlign: 'center' }}>{t('coaching.chemistry.orForm')}</div>
              </Editable>
            </div>
          </div>
        </div>
      </div>

      {/* ENQUIRY FORM */}
      <div id="enquiry" className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Heading label={t('coaching.enquiry.label')} title={t('coaching.enquiry.heading')} />
          <CoachingEnquiryForm />
        </div>
      </div>
    </div>
  );
}
