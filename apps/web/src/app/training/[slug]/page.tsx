import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import { getCourse } from '@/lib/events';
import { durationLong, formatPrice, formatDateRange, type EventTemplate, type ScheduledEvent } from '@/lib/events-types';
import { buildMetadata, JsonLd, breadcrumbJsonLd, courseJsonLd, truncateText , siteName } from '@/lib/seo';
import { InterestForm } from './InterestForm';
import { colors as p, fonts } from '@/lib/brand';
import { requireModule, moduleHidden } from '@/lib/module-gate';
import { pageName } from '@/lib/copy/pageName';
import { getCopy } from '@/lib/copy';
import { getSiteSettings } from '@/lib/site-settings';
import { ctaHref } from '@/lib/cta';
import { Editable } from '@/components/edit/Editable';

/** What a course says about itself when nobody has written a description: its short one, or its
 *  name. It said "Agile training course: <name>." on every site, whatever that site taught. */
const describe = (course: EventTemplate) => course.description || course.short_description || course.title;

export const dynamic = 'force-dynamic';


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  // A page this site has switched off does not name itself. See lib/module-gate.ts.
  if (await moduleHidden('events')) return {};
  const { slug: id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: `Course Not Found - ${await siteName()}` };
  const description = course.seo_description || truncateText(describe(course), 160);
  return buildMetadata({
    title: course.seo_title || course.title,
    description,
    // The slug, whatever was asked for. A uuid request is redirected below, but metadata is built
    // first and a canonical pointing at the address we are redirecting AWAY from is a canonical
    // that argues with itself.
    path: `/training/${course.slug || id}`,
  });
}

function upcomingEvents(course: EventTemplate, now: number): ScheduledEvent[] {
  return (course.events || [])
    .filter((e) => e.is_published && e.start_date && new Date(e.start_date).getTime() > now)
    .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
}

function renderDescription(text: string | null): string {
  if (!text) return '';
  const html = /<[a-z][\s\S]*>/i.test(text) ? text : String(marked.parse(text, { async: false }));
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireModule('events');
  const { slug: id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  // One course, one address.
  //
  // These pages were `/courses/<uuid>` - forty-odd characters of hex carrying no word anybody would
  // search for, in a result that has to compete with Reed and The Knowledge Academy. Four of those
  // uuids are indexed, so they still resolve and are sent here permanently rather than dropped:
  // Google has to fetch the old address to learn where it went.
  if (course.slug && id !== course.slug) permanentRedirect(`/training/${course.slug}`);

  // The words every course page shares, from this site's copy. What the course itself says is its
  // own row, edited in Admin. The menu's own labels name the way back and the breadcrumb.
  const [t, nav, settings] = await Promise.all([getCopy('training'), getCopy('navigation'), getSiteSettings()]);
  const enquireHref = ctaHref('contact', settings as Record<string, unknown>);

  const now = Date.now();
  const dates = upcomingEvents(course, now);
  const duration = durationLong(course.duration_days, { day: t('training.facts.day'), days: t('training.facts.days') });
  const level = course.levels?.name;
  const tags = course.template_tags || [];
  const outcomes = course.learning_outcomes || [];
  const benefits = course.key_benefits || [];
  const prereqs = course.prerequisites || [];
  const difficulty = course.difficulty_rating;
  const filledPips = difficulty === 'advanced' ? 3 : difficulty === 'intermediate' ? 2 : 1;
  const levels: Record<string, string> = {
    beginner: t('training.level.beginner'), intermediate: t('training.level.intermediate'), advanced: t('training.level.advanced'),
  };
  const difficultyLabel = difficulty ? levels[difficulty] ?? difficulty : '';
  const bothFormats = t('training.facts.bothFormats');

  return (
    <div style={{ fontFamily: fonts.sans, background: p.white }}>
      <JsonLd
        data={await courseJsonLd({
          name: course.title,
          description: truncateText(describe(course), 300),
          path: `/training/${id}`,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: nav('nav.home').trim() || 'Home', path: '/' },
          // The catalogue, by whatever this site calls it in its menu. It said "Courses" while
          // the menu said "Courses and Workshops" and half of these are workshops.
          { name: await pageName('events', 'Courses and Workshops'), path: '/events' },
          { name: course.title, path: `/training/${id}` },
        ])}
      />

      <style>{`
        .cd-body-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; align-items: start; max-width: 1000px; margin: 0 auto; padding: 40px 24px 64px; }
        .cd-benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cd-meta-strip { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
        .cd-md h2 { font-family: ${fonts.serif}; color: ${p.deepTeal}; font-size: 22px; font-weight: 400; margin: 28px 0 12px; }
        .cd-md h3 { color: ${p.deepTeal}; font-size: 18px; font-weight: 700; margin: 24px 0 8px; }
        .cd-md p { margin: 0 0 16px; }
        .cd-md ul, .cd-md ol { padding-left: 24px; margin: 0 0 16px; }
        .cd-md li { margin-bottom: 6px; }
        .cd-md strong { color: ${p.deepTeal}; }
        @media (max-width: 767px) {
          .cd-body-grid { grid-template-columns: 1fr; gap: 28px; }
          .cd-benefits-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Hero */}
      <div style={{ background: p.deepTeal, padding: '48px 0 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          {/* By whatever this site calls the catalogue in its menu. It said "All Events" while the
              menu might say Courses, Training or anything else. */}
          <Link href="/events" style={{ color: p.lightTeal, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>← {await pageName('events', 'All Events')}</Link>
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ border: `1px solid ${p.lightTeal}`, color: p.lightTeal, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'transparent' }}>{tag}</span>
              ))}
            </div>
          )}
          <h1 style={{ fontFamily: fonts.serif, color: p.white, fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 400, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-0.01em' }}>{course.title}</h1>
          <div className="cd-meta-strip">
            {duration && <span style={{ color: p.lightTeal, fontSize: 14 }}>{duration}</span>}
            {level && <span style={{ color: p.lightTeal, fontSize: 14 }}>{level}</span>}
            {course.certification_bodies?.name && <span style={{ color: p.lightTeal, fontSize: 14 }}>{`${course.certification_bodies.name} ${t('training.hero.accredited')}`.trim()}</span>}
            {dates.length === 0 && (
              <Editable k="training.hero.datesTbc" label="this badge">
                <span style={{ background: p.orange, color: p.deepTeal, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{t('training.hero.datesTbc')}</span>
              </Editable>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="cd-body-grid">
        {/* Main column */}
        <div>
          <section style={{ marginBottom: 40 }}>
            <Editable k="training.about.heading" label="this heading" as="div" block>
              <h2 style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 28, fontWeight: 400, margin: '0 0 16px' }}>{t('training.about.heading')}</h2>
            </Editable>
            <div className="cd-md" style={{ color: p.body, fontSize: 16, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: renderDescription(course.description) }} />
          </section>

          {outcomes.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <Editable k="training.learn.heading" label="this heading" as="div" block>
                <h2 style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>{t('training.learn.heading')}</h2>
              </Editable>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {outcomes.map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: p.midTeal, color: p.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, fontSize: 13, fontWeight: 800 }}>✓</span>
                    <span style={{ color: p.body, fontSize: 15, lineHeight: 1.6 }}>{o}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {benefits.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <Editable k="training.why.heading" label="this heading" as="div" block>
                <h2 style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>{t('training.why.heading')}</h2>
              </Editable>
              <div className="cd-benefits-grid">
                {benefits.map((b, i) => (
                  <div key={i} style={{ background: p.skyTeal, borderLeft: `3px solid ${p.orange}`, borderRadius: 8, padding: '16px 20px' }}>
                    <span style={{ color: p.body, fontSize: 15, lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(course.target_audience || prereqs.length > 0) && (
            <section style={{ marginBottom: 40, display: 'grid', gridTemplateColumns: course.target_audience && prereqs.length > 0 ? '1fr 1fr' : '1fr', gap: 24 }}>
              {course.target_audience && (
                <div>
                  <Editable k="training.who.heading" label="this heading" as="div" block>
                    <h2 style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 24, fontWeight: 400, margin: '0 0 16px' }}>{t('training.who.heading')}</h2>
                  </Editable>
                  <div style={{ background: p.paleTeal, borderRadius: 10, padding: '20px 24px' }}>
                    <p style={{ color: p.body, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{course.target_audience}</p>
                  </div>
                </div>
              )}
              {prereqs.length > 0 && (
                <div>
                  <Editable k="training.prerequisites.heading" label="this heading" as="div" block>
                    <h2 style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 24, fontWeight: 400, margin: '0 0 16px' }}>{t('training.prerequisites.heading')}</h2>
                  </Editable>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                    {prereqs.map((pr, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.orange, flexShrink: 0, marginTop: 7 }} />
                        <span style={{ color: p.body, fontSize: 15, lineHeight: 1.6 }}>{pr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section style={{ border: `2px dashed ${p.lightTeal}`, borderRadius: 12, padding: '28px 24px', textAlign: 'center' }}>
            <Editable k="training.private.body" label="this question" as="div" block>
              <p style={{ color: p.body, fontSize: 16, margin: '0 0 12px' }}>{t('training.private.body')}</p>
            </Editable>
            {/* Wherever this site can take an enquiry: /contact answers Not Found with Contact off. */}
            <Editable k="training.private.cta" label="this link" outside>
              <Link href={enquireHref} style={{ color: p.orange, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>{t('training.private.cta')}</Link>
            </Editable>
          </section>
        </div>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: 24 }}>
          {dates.length > 0 ? (
            <div style={{ border: `1px solid ${p.lightTeal}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: p.deepTeal, padding: '20px 24px' }}>
                <Editable k="training.dates.heading" label="this heading" as="div" block>
                  <div style={{ fontFamily: fonts.serif, color: p.white, fontSize: 22, fontWeight: 400 }}>{t('training.dates.heading')}</div>
                </Editable>
              </div>
              <div style={{ padding: '12px 24px 24px' }}>
                {dates.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${p.paleTeal}`, textDecoration: 'none' }}>
                    <div>
                      <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 14 }}>{formatDateRange(e.start_date!, e.end_date)}</div>
                      <div style={{ color: p.muted, fontSize: 12 }}>{`${formatPrice(e.price_cents, e.currency)} ${t('training.dates.priceSuffix')}`.trim()}</div>
                    </div>
                    <span style={{ color: p.orange, fontWeight: 700, fontSize: 13 }}>{t('training.dates.register')}</span>
                  </Link>
                ))}
                {difficulty && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 14 }}>
                    {[1, 2, 3].map((i) => (
                      <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i <= filledPips ? p.orange : p.lightTeal }} />
                    ))}
                    <span style={{ color: p.muted, fontSize: 13, marginLeft: 4 }}>{difficultyLabel}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ border: `2px dashed ${p.lightTeal}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: p.skyTeal, padding: '24px 24px 20px' }}>
                <Editable k="training.noDates.heading" label="this heading" as="div" block>
                  <div style={{ fontFamily: fonts.serif, color: p.deepTeal, fontSize: 22, fontWeight: 400, marginBottom: 8 }}>{t('training.noDates.heading')}</div>
                </Editable>
                <Editable k="training.noDates.body" label="this text" as="div" block>
                  <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{t('training.noDates.body')}</p>
                </Editable>
              </div>
              <div style={{ padding: '20px 24px 24px' }}>
                {duration && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${p.paleTeal}` }}>
                    <span style={{ color: p.muted, fontSize: 14 }}>{t('training.facts.duration')}</span>
                    <span style={{ color: p.deepTeal, fontSize: 14, fontWeight: 700 }}>{duration}</span>
                  </div>
                )}
                {course.formats?.name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${p.paleTeal}` }}>
                    <span style={{ color: p.muted, fontSize: 14 }}>{t('training.facts.format')}</span>
                    <span style={{ color: p.deepTeal, fontSize: 14, fontWeight: 700 }}>{course.formats.name === 'Both' ? bothFormats : course.formats.name}</span>
                  </div>
                )}
                {difficulty && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 0' }}>
                    {[1, 2, 3].map((i) => (
                      <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i <= filledPips ? p.orange : p.lightTeal }} />
                    ))}
                    <span style={{ color: p.muted, fontSize: 13, marginLeft: 4 }}>{difficultyLabel}</span>
                  </div>
                )}
                <InterestForm
                  courseTitle={course.title}
                  words={{
                    nameLabel: t('training.interest.nameLabel'), emailLabel: t('training.interest.emailLabel'),
                    noteLabel: t('training.interest.noteLabel'), noteOptional: t('training.interest.noteOptional'),
                    submit: t('training.interest.submit'), footnote: t('training.interest.footnote'),
                    sentHeading: t('training.interest.sentHeading'), sentBody: t('training.interest.sentBody'),
                  }}
                />
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ background: p.paleTeal, color: p.deepTeal, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>{tag}</span>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
