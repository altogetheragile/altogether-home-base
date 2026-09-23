import { Fragment } from 'react';
import type { Metadata } from 'next';
import { getEventTemplates, getApprovedFeedback, toCardModel, type CourseCardModel } from '@/lib/events';
import { getSiteSettings } from '@/lib/site-settings';
import { bookingHref } from '@/lib/booking';
import { buildMetadata, JsonLd, breadcrumbJsonLd, courseListJsonLd } from '@/lib/seo';
import { EventsList } from './EventsList';
import { colors as c } from '@/lib/brand';
import { requireModule } from '@/lib/module-gate';
import { getCopy, lines } from '@/lib/copy';

export const dynamic = 'force-dynamic';


export async function generateMetadata(): Promise<Metadata> {
  const t = await getCopy('events');
  return buildMetadata({
  title: 'Agile Training Courses in London & the UK',
  description: t('events.meta.description'),
  path: '/events',
});
}

export default async function EventsPage() {
  await requireModule('events');
  const [templates, feedback, settings, t] = await Promise.all([
    getEventTemplates(),
    getApprovedFeedback(),
    getSiteSettings(),
    getCopy('events'),
  ]);

  // Stamp "now" once on the server so card date filtering is deterministic.
  const now = Date.now();
  const courses: CourseCardModel[] = templates.map((template) => toCardModel(template, feedback, now));
  const firstNameOnly = settings.show_testimonial_first_name_only ?? false;
  const bookingUrl = bookingHref(settings.show_bookings);
  const scheduledCount = courses.filter((m) => m.scheduledDates.length > 0).length;
  const stats = [
    { n: String(courses.length), label: t('events.stats.courses') },
    { n: String(scheduledCount), label: t('events.stats.scheduled') },
    { n: t('events.stats.trained.number'), label: t('events.stats.trained.label') },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: c.white }}>
      <JsonLd
        data={await courseListJsonLd(
          'Agile Training Courses and Workshops',
          courses.map((m) => ({ name: m.title, description: m.description, path: m.href })),
        )}
      />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Courses and Workshops', path: '/events' }])} />

      <style>{`
        .aa-page-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: end; }
        .aa-hero-pad { padding: 64px 48px 0; }
        .aa-bespoke { display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center; }
        @media (max-width: 767px) {
          .aa-page-intro { grid-template-columns: 1fr; gap: 24px; }
          .aa-hero-pad { padding: 40px 20px 0; }
          .aa-bespoke { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero (server-rendered: H1 + intro are the SEO-critical content) */}
      <div style={{ background: c.heroTeal }} className="aa-hero-pad">
        <div className="aa-page-intro" style={{ paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: c.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>{t('events.hero.eyebrow')}</div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
              {lines(t('events.hero.heading')).map((l, i) => (<Fragment key={l}>{i > 0 && <br />}{l}</Fragment>))}
            </h1>
            <p style={{ color: c.lightTeal, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              {t('events.hero.intro')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'flex-end' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t('events.help.heading')}</div>
              <p style={{ color: c.lightTeal, fontSize: 13, lineHeight: 1.6, margin: '0 0 14px' }}>{t('events.help.body')}</p>
              <a href={bookingUrl} style={{ background: c.orange, color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', width: 'fit-content', display: 'inline-block' }}>
                {t('events.help.cta')}
              </a>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div style={{ color: c.orange, fontSize: 22, fontWeight: 800 }}>{s.n}</div>
                  <div style={{ color: c.lightTeal, fontSize: 11 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs + course grid (client: filter is interactive) */}
      <EventsList courses={courses} firstNameOnly={firstNameOnly} />

      {/* Bespoke CTA */}
      <div style={{ background: c.heroTeal, padding: '56px 48px' }}>
        <div className="aa-bespoke" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div>
            <div style={{ color: c.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{t('events.bespoke.eyebrow')}</div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>{t('events.bespoke.heading')}</h2>
            <p style={{ color: c.lightTeal, fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
              {t('events.bespoke.body')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <a href="/contact" style={{ background: c.orange, color: c.deepTeal, padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
              {t('events.bespoke.cta')}
            </a>
            <div style={{ color: c.lightTeal, fontSize: 12, textAlign: 'center' }}>{t('events.bespoke.reassurance')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
