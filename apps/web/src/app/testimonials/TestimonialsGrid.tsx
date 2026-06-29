'use client';

import { useMemo, useState } from 'react';
import type { Feedback } from '@/lib/testimonials';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  const full = Math.floor(r / 2);
  const half = r % 2 === 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = i < full ? p.orange : i === full && half ? 'url(#half)' : p.paleTeal;
        return (
          <svg key={i} width={15} height={15} viewBox="0 0 256 256" fill={fill}>
            {i === full && half && (
              <defs><linearGradient id="half"><stop offset="50%" stopColor={p.orange} /><stop offset="50%" stopColor={p.paleTeal} /></linearGradient></defs>
            )}
            <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z" />
          </svg>
        );
      })}
      <span style={{ color: p.muted, fontSize: 12, marginLeft: 4 }}>{r}/10</span>
    </div>
  );
}

const LinkedInIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;

function Card({ f, showName, firstNameOnly, showCompany }: { f: Feedback; showName: boolean; firstNameOnly: boolean; showCompany: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const needs = f.comment.length > 240;
  const text = needs && !expanded ? f.comment.slice(0, 240).trimEnd() + '...' : f.comment;
  const name = firstNameOnly ? f.first_name : `${f.first_name} ${f.last_name}`.trim();
  return (
    <div style={{ background: p.white, border: `1px solid ${p.paleTeal}`, borderRadius: 14, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <Stars rating={f.rating} />
        {f.is_featured && <span style={{ background: p.orange, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Featured</span>}
      </div>
      {f.course_name && <span style={{ alignSelf: 'flex-start', background: p.skyTeal, color: p.midTeal, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{f.course_name}</span>}
      <div style={{ color: p.body, fontSize: 14, lineHeight: 1.7, flex: 1 }}>
        <span style={{ fontStyle: 'italic' }}>&ldquo;{text}&rdquo;</span>
        {needs && <button onClick={() => setExpanded((e) => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: p.orange, fontSize: 'inherit', fontWeight: 600, marginLeft: 4 }}>{expanded ? 'Show less' : 'Read more'}</button>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
        <div>
          {showName && <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13 }}>{name}</div>}
          <div style={{ color: p.muted, fontSize: 12 }}>{f.job_title}{f.job_title && showCompany && f.company ? ' · ' : ''}{showCompany ? f.company : ''}</div>
          <div style={{ color: p.muted, fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            {f.source === 'linkedin' && <LinkedInIcon />}
            <span>{formatDate(f.submitted_at)}</span>
          </div>
        </div>
        {f.source_url && <a href={f.source_url} target="_blank" rel="noopener noreferrer" style={{ color: p.midTeal, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>View original</a>}
      </div>
    </div>
  );
}

export function TestimonialsGrid({ feedback, showName, firstNameOnly, showCompany }: { feedback: Feedback[]; showName: boolean; firstNameOnly: boolean; showCompany: boolean }) {
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('all');
  const [rating, setRating] = useState('all');

  const courses = useMemo(() => [...new Set(feedback.map((f) => f.course_name).filter(Boolean))].sort(), [feedback]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return feedback.filter((f) => {
      const matchesSearch = !q || [f.first_name, f.last_name, f.company, f.course_name, f.comment].some((v) => (v || '').toLowerCase().includes(q));
      const matchesCourse = course === 'all' || f.course_name === course;
      const matchesRating = rating === 'all' || (f.rating ?? 0) >= parseInt(rating, 10);
      return matchesSearch && matchesCourse && matchesRating;
    });
  }, [feedback, search, course, rating]);

  const selectStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: `1px solid ${p.lightTeal}`, fontSize: 14, color: p.body, background: p.white, outline: 'none' };

  return (
    <>
      <div style={{ background: '#fff', borderBottom: `1px solid ${p.lightTeal}`, padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search testimonials..." style={{ ...selectStyle, flex: 1, minWidth: 200 }} />
          <select value={course} onChange={(e) => setCourse(e.target.value)} style={selectStyle}>
            <option value="all">All Courses</option>
            {courses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={rating} onChange={(e) => setRating(e.target.value)} style={selectStyle}>
            <option value="all">All Ratings</option>
            <option value="9">9+ Stars</option>
            <option value="8">8+ Stars</option>
            <option value="7">7+ Stars</option>
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filtered.map((f) => <Card key={f.id} f={f} showName={showName} firstNameOnly={firstNameOnly} showCompany={showCompany} />)}
        </div>
        {filtered.length === 0 && <p style={{ textAlign: 'center', color: p.muted, marginTop: 24 }}>No testimonials found matching your filters.</p>}
      </div>
    </>
  );
}
