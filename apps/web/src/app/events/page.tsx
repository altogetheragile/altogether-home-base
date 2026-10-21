import { Fragment } from 'react';
import { Editable } from '@/components/edit/Editable';
import type { Metadata } from 'next';
import { getEventTemplates, getApprovedFeedback, toCardModel, type CourseCardModel } from '@/lib/events';
import { getSiteSettings } from '@/lib/site-settings';
import { bookingHref } from '@/lib/booking';
import { ctaHref } from '@/lib/cta';
import { creditRules } from '@/lib/quoteCredit';
import { buildMetadata, JsonLd, breadcrumbJsonLd, courseListJsonLd } from '@/lib/seo';
import { EventsList } from './EventsList';
import { colors as c, fonts } from '@/lib/brand';
import { requireModule, moduleHidden } from '@/lib/module-gate';
import { getCopy, lines } from '@/lib/copy';
import { pageCrumbs } from '@/lib/copy/pageName';

export const dynamic = 'force-dynamic';


export async function generateMetadata(): Promise<Metadata> {
  // A page this site has switched off does not name itself. See lib/module-gate.ts.
  if (await moduleHidden('events')) return {};
  const t = await getCopy('events');
  return buildMetadata({
  title: t('events.meta.titlePrefix'),
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
  const cardWords = {
    groupSize: t('events.card.groupSize'), halfDay: t('events.card.halfDay'), day: t('events.card.day'), days: t('events.card.days'),
  };
  const courses: CourseCardModel[] = templates.map((template) => toCardModel(template, feedback, now, cardWords));
  // Wherever this site can take an enquiry. Both buttons said /contact whatever was switched on.
  const enquireHref = ctaHref('contact', settings as Record<string, unknown>);
  const bookingUrl = bookingHref(settings.show_bookings);
  const scheduledCount = courses.filter((m) => m.scheduledDates.length > 0).length;
  const stats = [
    { n: String(courses.length), label: t('events.stats.courses'), k: 'events.stats.courses' },
    { n: String(scheduledCount), label: t('events.stats.scheduled'), k: 'events.stats.scheduled' },
    { n: t('events.stats.trained.number'), label: t('events.stats.trained.label'), k: 'events.stats.trained.number' },
  // Courses and scheduled dates are counted from the database, so they are always true. The number
  // trained is typed in by a person, and a new site has trained nobody.
  ].filter((s) => s.n.trim());

  return (
    <div style={{ fontFamily: fonts.sans, background: c.white }}>
      <JsonLd
        // What this site calls the page. It was "Agile Training Courses and Workshops" on every site.
        data={await courseListJsonLd(
          t('events.meta.titlePrefix'),
          courses.map((m) => ({ name: m.title, description: m.description, path: m.href })),
        )}
      />
      <JsonLd data={breadcrumbJsonLd(await pageCrumbs('events', '/events', 'Courses and Workshops'))} />

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
            <Editable k="events.hero.eyebrow" label="this text" as="div" block>
              <div style={{ color: c.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>{t('events.hero.eyebrow')}</div>
            </Editable>
            <Editable k="events.hero.heading" label="this heading" as="div" block>
              <h1 style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
                {lines(t('events.hero.heading')).map((l, i) => (<Fragment key={l}>{i > 0 && <br />}{l}</Fragment>))}
              </h1>
            </Editable>
            <Editable k="events.hero.intro" label="this text" as="div" block>
              <p style={{ color: c.lightTeal, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
                {t('events.hero.intro')}
              </p>
            </Editable>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'flex-end' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
              <Editable k="events.help.heading" label="this text" as="div" block>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t('events.help.heading')}</div>
              </Editable>
              <Editable k="events.help.body" label="this text" as="div" block>
                <p style={{ color: c.lightTeal, fontSize: 13, lineHeight: 1.6, margin: '0 0 14px' }}>{t('events.help.body')}</p>
              </Editable>
              <Editable k="events.help.cta" label="this button" outside>
                <a href={bookingUrl} style={{ background: c.orange, color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', width: 'fit-content', display: 'inline-block' }}>
                  {t('events.help.cta')}
                </a>
              </Editable>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {stats.map((s) => (
                <Editable key={s.k} k={s.k} label="this figure" as="div" block>
                  <div style={{ color: c.orange, fontSize: 22, fontWeight: 800 }}>{s.n}</div>
                  <div style={{ color: c.lightTeal, fontSize: 11 }}>{s.label}</div>
                </Editable>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs + course grid (client: filter is interactive) */}
      <EventsList
        courses={courses}
        rules={creditRules(settings)}
        enquireHref={enquireHref}
        words={{
          all: t('events.list.all'), countOne: t('events.list.countOne'), countMany: t('events.list.countMany'), empty: t('events.list.empty'),
          datesTbc: t('events.card.datesTbc'), quoteHeading: t('events.card.quoteHeading'), forLabel: t('events.card.forLabel'),
          showObjectives: t('events.card.showObjectives'), hideObjectives: t('events.card.hideObjectives'),
          details: t('events.card.details'), enquire: t('events.card.enquire'),
          bothFormats: t('events.card.bothFormats'), accredited: t('events.card.accredited'),
        }}
      />

      {/* Bespoke CTA */}
      <div style={{ background: c.heroTeal, padding: '56px 48px' }}>
        <div className="aa-bespoke" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div>
            <Editable k="events.bespoke.eyebrow" label="this text" as="div" block>
              <div style={{ color: c.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{t('events.bespoke.eyebrow')}</div>
            </Editable>
            <Editable k="events.bespoke.heading" label="this text" as="div" block>
              <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>{t('events.bespoke.heading')}</h2>
            </Editable>
            <Editable k="events.bespoke.body" label="this text" as="div" block>
              <p style={{ color: c.lightTeal, fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
                {t('events.bespoke.body')}
              </p>
            </Editable>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Editable k="events.bespoke.cta" label="this button" as="div" block outside>
              <a href={enquireHref} style={{ display: 'block', background: c.orange, color: c.deepTeal, padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
                {t('events.bespoke.cta')}
              </a>
            </Editable>
            <Editable k="events.bespoke.reassurance" label="this text" as="div" block>
              <div style={{ color: c.lightTeal, fontSize: 12, textAlign: 'center' }}>{t('events.bespoke.reassurance')}</div>
            </Editable>
          </div>
        </div>
      </div>
    </div>
  );
}
