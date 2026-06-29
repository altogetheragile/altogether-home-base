import type { Metadata } from 'next';
import { getEventTemplates, getApprovedFeedback, toCardModel, type CourseCardModel } from '@/lib/events';
import { getSiteSettings } from '@/lib/site-settings';
import { buildMetadata, JsonLd, breadcrumbJsonLd, courseListJsonLd } from '@/lib/seo';
import { EventsList } from './EventsList';

export const dynamic = 'force-dynamic';

const c = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };
const BOOKING_URL = 'https://calendly.com/alundaviesbaker/30min';

export const metadata: Metadata = buildMetadata({
  title: 'Agile Training Courses in London & the UK',
  description:
    'Framework-based agile training courses covering AgilePM, Scrum Master, Product Owner, and more. Delivered in person across the London area at your site, or live online across the UK.',
  path: '/events',
});

export default async function EventsPage() {
  const [templates, feedback, settings] = await Promise.all([
    getEventTemplates(),
    getApprovedFeedback(),
    getSiteSettings(),
  ]);

  // Stamp "now" once on the server so card date filtering is deterministic.
  const now = Date.now();
  const courses: CourseCardModel[] = templates.map((t) => toCardModel(t, feedback, now));
  const firstNameOnly = settings.show_testimonial_first_name_only ?? false;
  const scheduledCount = courses.filter((m) => m.scheduledDates.length > 0).length;
  const stats = [
    { n: String(courses.length), label: 'Courses offered' },
    { n: String(scheduledCount), label: 'Dates scheduled' },
    { n: '1,500+', label: 'Practitioners trained' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: c.white }}>
      <JsonLd
        data={courseListJsonLd(
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
      <div style={{ background: '#006666' }} className="aa-hero-pad">
        <div className="aa-page-intro" style={{ paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: c.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Courses &amp; Events</div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
              Every course, run personally.<br />No associates. No surprises.
            </h1>
            <p style={{ color: c.lightTeal, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              Browse the full catalogue below. Delivered in person across the London area at your site, or live online across the UK. Courses with a date scheduled show an orange badge - all others can be arranged for your team or organisation on request.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'flex-end' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Not sure where to start?</div>
              <p style={{ color: c.lightTeal, fontSize: 13, lineHeight: 1.6, margin: '0 0 14px' }}>Book a free 30-minute chemistry session and we&apos;ll work out the best fit together.</p>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: c.orange, color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', width: 'fit-content', display: 'inline-block' }}>
                Book a chemistry session
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
      <div style={{ background: '#006666', padding: '56px 48px' }}>
        <div className="aa-bespoke" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div>
            <div style={{ color: c.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>In-house &amp; bespoke</div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>Need it tailored for your team?</h2>
            <p style={{ color: c.lightTeal, fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
              Every course can be delivered in-house - adapted to your context, your team size, and your organisation&apos;s way of working. Same quality, no generic materials.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <a href="/contact" style={{ background: c.orange, color: c.deepTeal, padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
              Book a conversation →
            </a>
            <div style={{ color: c.lightTeal, fontSize: 12, textAlign: 'center' }}>No hard sell. Just a conversation.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
