import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import { getCourse } from '@/lib/events';
import { durationLong, formatPrice, formatDateRange, type EventTemplate, type ScheduledEvent } from '@/lib/events-types';
import { buildMetadata, JsonLd, breadcrumbJsonLd, courseJsonLd, truncateText } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: 'Course Not Found - Altogether Agile' };
  const description = course.seo_description || truncateText(course.description || `Agile training course: ${course.title}.`, 160);
  return buildMetadata({
    title: course.seo_title || course.title,
    description,
    path: `/courses/${id}`,
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

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) notFound();

  const now = Date.now();
  const dates = upcomingEvents(course, now);
  const duration = durationLong(course.duration_days);
  const level = course.levels?.name;
  const tags = course.template_tags || [];
  const outcomes = course.learning_outcomes || [];
  const benefits = course.key_benefits || [];
  const prereqs = course.prerequisites || [];
  const difficulty = course.difficulty_rating;
  const filledPips = difficulty === 'advanced' ? 3 : difficulty === 'intermediate' ? 2 : 1;
  const difficultyLabel = difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : 'Beginner';

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: p.white }}>
      <JsonLd
        data={courseJsonLd({
          name: course.title,
          description: truncateText(course.description || `Agile training course: ${course.title}.`, 300),
          path: `/courses/${id}`,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Courses', path: '/events' },
          { name: course.title, path: `/courses/${id}` },
        ])}
      />

      <style>{`
        .cd-body-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; align-items: start; max-width: 1000px; margin: 0 auto; padding: 40px 24px 64px; }
        .cd-benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cd-meta-strip { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
        .cd-md h2 { font-family: 'DM Serif Display', serif; color: ${p.deepTeal}; font-size: 22px; font-weight: 400; margin: 28px 0 12px; }
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
          <Link href="/events" style={{ color: p.lightTeal, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>← All Events</Link>
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ border: `1px solid ${p.lightTeal}`, color: p.lightTeal, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: 'transparent' }}>{tag}</span>
              ))}
            </div>
          )}
          <h1 style={{ fontFamily: "'DM Serif Display', serif", color: p.white, fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 400, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-0.01em' }}>{course.title}</h1>
          <div className="cd-meta-strip">
            {duration && <span style={{ color: p.lightTeal, fontSize: 14 }}>{duration}</span>}
            {level && <span style={{ color: p.lightTeal, fontSize: 14 }}>{level}</span>}
            {course.certification_bodies?.name && <span style={{ color: p.lightTeal, fontSize: 14 }}>{course.certification_bodies.name} accredited</span>}
            {dates.length === 0 && (
              <span style={{ background: p.orange, color: p.deepTeal, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>Dates TBC</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="cd-body-grid">
        {/* Main column */}
        <div>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", color: p.deepTeal, fontSize: 28, fontWeight: 400, margin: '0 0 16px' }}>About This Course</h2>
            <div className="cd-md" style={{ color: p.body, fontSize: 16, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: renderDescription(course.description) }} />
          </section>

          {outcomes.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", color: p.deepTeal, fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>What You&apos;ll Learn</h2>
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
              <h2 style={{ fontFamily: "'DM Serif Display', serif", color: p.deepTeal, fontSize: 28, fontWeight: 400, margin: '0 0 20px' }}>Why This Course</h2>
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
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", color: p.deepTeal, fontSize: 24, fontWeight: 400, margin: '0 0 16px' }}>Who Is This For</h2>
                  <div style={{ background: p.paleTeal, borderRadius: 10, padding: '20px 24px' }}>
                    <p style={{ color: p.body, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{course.target_audience}</p>
                  </div>
                </div>
              )}
              {prereqs.length > 0 && (
                <div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", color: p.deepTeal, fontSize: 24, fontWeight: 400, margin: '0 0 16px' }}>Prerequisites</h2>
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
            <p style={{ color: p.body, fontSize: 16, margin: '0 0 12px' }}>Want to run this course privately for your team?</p>
            <Link href="/contact" style={{ color: p.orange, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Get in touch →</Link>
          </section>
        </div>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: 24 }}>
          {dates.length > 0 ? (
            <div style={{ border: `1px solid ${p.lightTeal}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: p.deepTeal, padding: '20px 24px' }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", color: p.white, fontSize: 22, fontWeight: 400 }}>Upcoming dates</div>
              </div>
              <div style={{ padding: '12px 24px 24px' }}>
                {dates.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${p.paleTeal}`, textDecoration: 'none' }}>
                    <div>
                      <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 14 }}>{formatDateRange(e.start_date!, e.end_date)}</div>
                      <div style={{ color: p.muted, fontSize: 12 }}>{formatPrice(e.price_cents, e.currency)} + VAT</div>
                    </div>
                    <span style={{ color: p.orange, fontWeight: 700, fontSize: 13 }}>Register →</span>
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
                <div style={{ fontFamily: "'DM Serif Display', serif", color: p.deepTeal, fontSize: 22, fontWeight: 400, marginBottom: 8 }}>No Dates Scheduled Yet</div>
                <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>This course is available for private or scheduled delivery. Get in touch and we&apos;ll arrange dates that work for your team.</p>
              </div>
              <div style={{ padding: '20px 24px 24px' }}>
                {duration && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${p.paleTeal}` }}>
                    <span style={{ color: p.muted, fontSize: 14 }}>Typical duration</span>
                    <span style={{ color: p.deepTeal, fontSize: 14, fontWeight: 700 }}>{duration}</span>
                  </div>
                )}
                {course.formats?.name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${p.paleTeal}` }}>
                    <span style={{ color: p.muted, fontSize: 14 }}>Format</span>
                    <span style={{ color: p.deepTeal, fontSize: 14, fontWeight: 700 }}>{course.formats.name === 'Both' ? 'In-person & remote' : course.formats.name}</span>
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
                <a href="/contact" style={{ display: 'block', background: p.orange, color: p.white, padding: '14px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', textAlign: 'center', marginTop: 16 }}>Enquire About This Course</a>
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
