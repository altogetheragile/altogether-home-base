'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CourseCardModel, CourseFeedback } from '@/lib/events-types';
import { credit, type CreditRules } from '@/lib/quoteCredit';
import { colors as p } from '@/lib/brand';
import registry from '@/lib/copy/events.json';

// The colours the three kinds this site started with have always had, kept so they do not change.
// Any other kind somebody adds in Admin takes the next of the palette, by its place in the tabs.
const categoryColours: Record<string, { solid: string; pill: string; light: string }> = {
  Course: { solid: '#1A9090', pill: '#0D5C5C', light: '#E6F5F5' },
  Workshop: { solid: '#2E9E6E', pill: '#1A5C40', light: '#E6F5EE' },
  Masterclass: { solid: '#6B5FCC', pill: '#3D3580', light: '#EEECF9' },
};
const palette = Object.values(categoryColours);
const colourFor = (type: string, types: string[]) =>
  categoryColours[type] ?? palette[Math.max(0, types.indexOf(type)) % palette.length];

const WORDS = ['all', 'countOne', 'countMany', 'empty'] as const;
const CARD_WORDS = ['datesTbc', 'quoteHeading', 'forLabel', 'showObjectives', 'hideObjectives', 'details', 'enquire',
  'bothFormats', 'accredited'] as const;
export type ListWords = Record<(typeof WORDS)[number] | (typeof CARD_WORDS)[number], string>;

// This site's words come from the page. The shipped ones are read from the registry, not written
// here a second time, so a caller that passes nothing still says something.
const entries = registry.entries as Record<string, { value: string }>;
const shipped = Object.fromEntries([
  ...WORDS.map((w) => [w, entries[`events.list.${w}`].value]),
  ...CARD_WORDS.map((w) => [w, entries[`events.card.${w}`].value]),
]) as ListWords;

function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 5;
  return (
    <span style={{ color: p.orange, fontSize: 10, letterSpacing: 1 }} aria-label={`${r} out of 5`}>
      {'★★★★★'.slice(0, r)}
      <span style={{ color: p.lightTeal }}>{'★★★★★'.slice(r)}</span>
    </span>
  );
}

function CardQuote({ t, rules, heading }: { t: CourseFeedback; rules: CreditRules; heading: string }) {
  // The testimonials page's switches, which these quotes used to ignore: an anonymous site still
  // named people on its course cards.
  const { name, role } = credit(t, rules);
  return (
    <div style={{ borderTop: `1px solid ${p.paleTeal}`, paddingTop: 14, marginTop: 4 }}>
      {heading.trim() && <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{heading}</div>}
      <div style={{ background: p.skyTeal, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ color: p.body, fontSize: 12, lineHeight: 1.65, marginBottom: 10, fontStyle: 'italic' }}>&ldquo;{t.comment}&rdquo;</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {name && <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 11 }}>{name}</div>}
            {role && <div style={{ color: p.muted, fontSize: 10 }}>{role}</div>}
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

function CourseCard({ course, index, rules, w, types, enquireHref }: {
  course: CourseCardModel; index: number; rules: CreditRules; w: ListWords; types: string[]; enquireHref: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const col = colourFor(course.type, types);
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
          <div style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{w.datesTbc}</div>
        )}
      </div>

      <div style={{ padding: '18px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: col.pill, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{course.type}</span>
          {course.cert && <span style={{ background: p.paleTeal, color: p.midTeal, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{course.cert}</span>}
        </div>

        <Link href={course.href} style={{ color: p.deepTeal, fontSize: 18, fontWeight: 800, lineHeight: 1.2, textDecoration: 'none', display: 'block' }}>{course.title}</Link>

        {course.description && <div style={{ color: p.muted, fontSize: 13, lineHeight: 1.65 }}>{course.description}</div>}

        {course.testimonial && <CardQuote t={course.testimonial} rules={rules} heading={w.quoteHeading} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
          {course.duration && <MetaItem label={course.duration} />}
          {course.groupSize && <MetaItem label={course.groupSize} />}
          <MetaItem label={course.format === 'Both' ? w.bothFormats : course.format} />
          {course.cert && <MetaItem label={`${course.cert} ${w.accredited}`.trim()} />}
        </div>

        {course.forWho && (
          <div style={{ background: col.light, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: p.body, lineHeight: 1.5 }}>
            {w.forLabel.trim() && <span style={{ fontWeight: 700, color: col.pill }}>{w.forLabel} </span>}{course.forWho}
          </div>
        )}

        {course.objectives.length > 0 && (
          <div>
            <button onClick={() => setExpanded((e) => !e)} style={{ background: 'none', border: 'none', padding: 0, color: p.midTeal, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {expanded ? w.hideObjectives : w.showObjectives}
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
          <Link href={course.href} style={{ background: p.deepTeal, color: '#fff', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, flex: 1, textDecoration: 'none', textAlign: 'center' }}>{w.details}</Link>
          {/* Wherever this site can take an enquiry. It was /contact whatever, which answers Not
              Found on a site with Contact switched off. */}
          <Link href={enquireHref} style={{ background: 'none', border: `1px solid ${p.paleTeal}`, padding: '9px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, color: p.deepTeal, textDecoration: 'none' }}>{w.enquire}</Link>
        </div>
      </div>
    </div>
  );
}

export function EventsList({ courses, rules, words: given, enquireHref = '/contact' }: {
  courses: CourseCardModel[];
  rules: CreditRules;
  words?: Partial<ListWords>;
  /** Where Enquire goes, worked out by the page from what this site has switched on. */
  enquireHref?: string;
}) {
  const w = { ...shipped, ...given };
  // The kinds of course this site actually publishes, in the order they first appear. The tabs
  // were a fixed Course, Workshop and Masterclass, so a site whose kinds were named anything else
  // got three empty tabs and no way to reach its own courses by kind.
  const types = useMemo(() => [...new Set(courses.map((c) => c.type))], [courses]);
  // null is "all of them". A tab is a kind's name, which is somebody's own word and could be
  // anything, including whatever this site calls "All".
  const [active, setActive] = useState<string | null>(null);
  const filtered = useMemo(() => (active === null ? courses : courses.filter((c) => c.type === active)), [courses, active]);
  const tabs: { key: string | null; label: string; count: number }[] = [
    { key: null, label: w.all, count: courses.length },
    ...types.map((type) => ({ key: type, label: type, count: courses.filter((c) => c.type === type).length })),
  ];

  return (
    <>
      {/* Tab bar continues the teal hero */}
      <div style={{ background: p.heroTeal, padding: '0 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', maxWidth: 1200, margin: '0 auto' }}>
          {tabs.map((tab) => {
            const on = active === tab.key;
            return (
              <button
                key={tab.key ?? ''}
                onClick={() => setActive(tab.key)}
                aria-pressed={on}
                style={{ background: 'none', border: 'none', padding: '16px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: on ? p.orange : p.lightTeal, borderBottom: on ? `3px solid ${p.orange}` : '3px solid transparent', whiteSpace: 'nowrap' }}
              >
                {tab.label} <span style={{ fontSize: 11, opacity: 0.7 }}>({tab.count})</span>
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', paddingRight: 4, color: p.lightTeal, fontSize: 12, whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? w.countOne : w.countMany}
          </div>
        </div>
      </div>

      <div style={{ background: p.skyTeal, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} rules={rules} w={w} types={types} enquireHref={enquireHref} />
          ))}
          {filtered.length === 0 && <p style={{ color: p.muted }}>{w.empty}</p>}
        </div>
      </div>
    </>
  );
}
