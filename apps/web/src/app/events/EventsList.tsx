'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CourseCardModel, CourseFeedback } from '@/lib/events-types';
import { displayFeedbackName } from '@/lib/events-types';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };

const categoryColours: Record<string, { solid: string; pill: string; light: string }> = {
  Course: { solid: '#1A9090', pill: '#0D5C5C', light: '#E6F5F5' },
  Workshop: { solid: '#2E9E6E', pill: '#1A5C40', light: '#E6F5EE' },
  Masterclass: { solid: '#6B5FCC', pill: '#3D3580', light: '#EEECF9' },
};

const FILTERS = ['All', 'Course', 'Workshop', 'Masterclass'];

function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 5;
  return (
    <span style={{ color: p.orange, fontSize: 10, letterSpacing: 1 }} aria-label={`${r} out of 5`}>
      {'★★★★★'.slice(0, r)}
      <span style={{ color: p.lightTeal }}>{'★★★★★'.slice(r)}</span>
    </span>
  );
}

function CardQuote({ t, firstNameOnly }: { t: CourseFeedback; firstNameOnly: boolean }) {
  return (
    <div style={{ borderTop: `1px solid ${p.paleTeal}`, paddingTop: 14, marginTop: 4 }}>
      <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>What attendees say</div>
      <div style={{ background: p.skyTeal, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ color: p.body, fontSize: 12, lineHeight: 1.65, marginBottom: 10, fontStyle: 'italic' }}>&ldquo;{t.comment}&rdquo;</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 11 }}>{displayFeedbackName(t, firstNameOnly)}</div>
            <div style={{ color: p.muted, fontSize: 10 }}>{t.job_title || ''}</div>
          </div>
          <Stars rating={t.rating} />
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.muted, fontSize: 12 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.midTeal, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  );
}

function CourseCard({ course, index, firstNameOnly }: { course: CourseCardModel; index: number; firstNameOnly: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const col = categoryColours[course.type] || categoryColours.Course;
  const hasDate = course.scheduledDates.length > 0;
  const firstDate = hasDate ? course.scheduledDates[0] : null;

  return (
    <div style={{ background: p.white, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,77,77,0.07)', position: 'relative' }}>
      <div style={{ background: col.solid, height: 130, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -28, right: -28, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>{index + 1}</div>
        {hasDate ? (
          <div style={{ background: p.orange, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            {firstDate!.date}
            {course.scheduledDates.length > 1 && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '1px 6px', marginLeft: 2 }}>+{course.scheduledDates.length - 1}</span>}
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>Dates TBC</div>
        )}
      </div>

      <div style={{ padding: '18px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: col.pill, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{course.type}</span>
          {course.cert && <span style={{ background: p.paleTeal, color: p.midTeal, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{course.cert}</span>}
        </div>

        <Link href={course.href} style={{ color: p.deepTeal, fontSize: 18, fontWeight: 800, lineHeight: 1.2, textDecoration: 'none', display: 'block' }}>{course.title}</Link>

        {course.description && <div style={{ color: p.muted, fontSize: 13, lineHeight: 1.65 }}>{course.description}</div>}

        {course.testimonial && <CardQuote t={course.testimonial} firstNameOnly={firstNameOnly} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
          <MetaItem label={course.duration} />
          <MetaItem label={course.groupSize} />
          <MetaItem label={course.format === 'Both' ? 'In-person & remote' : course.format} />
          {course.cert && <MetaItem label={course.cert + ' accredited'} />}
        </div>

        {course.forWho && (
          <div style={{ background: col.light, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: p.body, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: col.pill }}>For: </span>{course.forWho}
          </div>
        )}

        {course.objectives.length > 0 && (
          <div>
            <button onClick={() => setExpanded((e) => !e)} style={{ background: 'none', border: 'none', padding: 0, color: p.midTeal, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {expanded ? 'Hide' : 'Show'} learning objectives
              <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 10 }}>▾</span>
            </button>
            {expanded && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {course.objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: p.body, fontSize: 12, lineHeight: 1.55 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: col.solid, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    {obj}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${p.paleTeal}`, paddingTop: 14, marginTop: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href={course.href} style={{ background: p.deepTeal, color: '#fff', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, flex: 1, textDecoration: 'none', textAlign: 'center' }}>View details</Link>
          <Link href="/contact" style={{ background: 'none', border: `1px solid ${p.paleTeal}`, padding: '9px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, color: p.deepTeal, textDecoration: 'none' }}>Enquire</Link>
        </div>
      </div>
    </div>
  );
}

export function EventsList({ courses, firstNameOnly }: { courses: CourseCardModel[]; firstNameOnly: boolean }) {
  const [active, setActive] = useState('All');
  const filtered = useMemo(() => (active === 'All' ? courses : courses.filter((c) => c.type === active)), [courses, active]);

  return (
    <>
      {/* Tab bar continues the teal hero */}
      <div style={{ background: '#006666', padding: '0 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', maxWidth: 1200, margin: '0 auto' }}>
          {FILTERS.map((f) => {
            const count = f === 'All' ? courses.length : courses.filter((c) => c.type === f).length;
            return (
              <button
                key={f}
                onClick={() => setActive(f)}
                aria-pressed={active === f}
                style={{ background: 'none', border: 'none', padding: '16px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: active === f ? p.orange : p.lightTeal, borderBottom: active === f ? `3px solid ${p.orange}` : '3px solid transparent', whiteSpace: 'nowrap' }}
              >
                {f} <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', paddingRight: 4, color: p.lightTeal, fontSize: 12, whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'course' : 'courses'}
          </div>
        </div>
      </div>

      <div style={{ background: p.skyTeal, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} firstNameOnly={firstNameOnly} />
          ))}
          {filtered.length === 0 && <p style={{ color: p.muted }}>No courses in this category yet.</p>}
        </div>
      </div>
    </>
  );
}
