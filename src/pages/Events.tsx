import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EventCardQuote } from '@/components/testimonials/TestimonialComponents';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { colors as p } from '@/theme/colors';

const categoryColours: Record<string, { solid: string; pill: string; light: string }> = {
  Course:      { solid: '#1A9090', pill: '#0D5C5C', light: '#E6F5F5' },
  Workshop:    { solid: '#2E9E6E', pill: '#1A5C40', light: '#E6F5EE' },
  Masterclass: { solid: '#6B5FCC', pill: '#3D3580', light: '#EEECF9' },
};

// ─── Responsive CSS classes ─────────────────────────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-events-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .aa-page-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: end; }
    .aa-card-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .aa-bespoke { display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center; }

    @media (max-width: 767px) {
      .aa-events-grid { grid-template-columns: 1fr; }
      .aa-page-intro { grid-template-columns: 1fr; gap: 24px; }
      .aa-card-meta { grid-template-columns: 1fr; }
      .aa-bespoke { grid-template-columns: 1fr; }
    }
  `}</style>
);

// ─── Phosphor-style bold SVG icons ──────────────────────────────────────────
const Icons = {
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
    </svg>
  ),
  Chat: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>
    </svg>
  ),
  Users: () => (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"/>
    </svg>
  ),
  Monitor: () => (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,40H48A24,24,0,0,0,24,64V176a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V64A24,24,0,0,0,208,40Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8Zm-48,40a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,216Z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,192Zm0-104a24,24,0,1,0,24,24A24,24,0,0,0,128,88Z"/>
    </svg>
  ),
  Certificate: () => (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M248,128a56,56,0,1,0-96,39.14V224a8,8,0,0,0,11.58,7.16L192,217.89l28.42,13.27A8,8,0,0,0,232,224V167.14A55.81,55.81,0,0,0,248,128ZM192,88a40,40,0,1,1-40,40A40,40,0,0,1,192,88Zm3.58,112.84a8,8,0,0,0-7.16,0L168,211.38V178.59a55.94,55.94,0,0,0,48,0v32.79ZM136,192H40V64H216v48.37a72.19,72.19,0,0,1,16,5.76V56a16,16,0,0,0-16-16H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H136.37A72.71,72.71,0,0,1,136,192ZM72,112H184a8,8,0,0,0,0-16H72a8,8,0,0,0,0,16Zm0,32h64a8,8,0,0,0,0-16H72a8,8,0,0,0,0,16Z"/>
    </svg>
  ),
  CalendarCheck: () => (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V96H208V208Zm0-128H48V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24ZM82.34,146.34,96,132.69l13.66,13.65a8,8,0,0,0,11.31-11.31l-19.31-19.31a8,8,0,0,0-11.32,0L70.34,135a8,8,0,1,0,11.32,11.31Zm96-19.31a8,8,0,0,0-11.32,0L128,166.06l-13.65-13.65a8,8,0,0,0-11.32,11.31l19.32,19.31a8,8,0,0,0,11.31,0l44.69-44.69A8,8,0,0,0,178.34,127Z"/>
    </svg>
  ),
};

// ─── Fallback course catalogue ──────────────────────────────────────────────
interface CourseItem {
  id: string;
  type: string;
  title: string;
  cert: string | null;
  forWho: string;
  duration: string;
  format: string;
  groupSize: string;
  objectives: string[];
  description: string;
  scheduledDates: { date: string; eventId: string }[];
}

const FALLBACK_COURSES: CourseItem[] = [
  {
    id: 'fallback-1', type: 'Course', title: 'AgilePM Foundation', cert: 'APMG',
    forWho: 'Project managers, programme managers, change leads', duration: '2 days', format: 'Both', groupSize: 'Up to 12',
    objectives: ['Understand the DSDM Agile Project Management framework', 'Apply timeboxing and iterative delivery in a project context', 'Prepare for and pass the AgilePM Foundation exam'],
    scheduledDates: [], description: 'The entry point to APMG\'s agile project management certification. Covers the DSDM framework, principles, and lifecycle — grounded in real project scenarios throughout.',
  },
  {
    id: 'fallback-2', type: 'Course', title: 'AgilePM Practitioner', cert: 'APMG',
    forWho: 'Certified Foundation holders ready to apply agile PM in depth', duration: '2 days', format: 'Both', groupSize: 'Up to 12',
    objectives: ['Apply the AgilePM framework to realistic project scenarios', 'Tailor agile governance to the needs of the organisation', 'Prepare for and pass the AgilePM Practitioner exam'],
    scheduledDates: [], description: 'Builds on Foundation to develop real-world application of the framework. Scenario-led throughout, with structured exam preparation woven in.',
  },
  {
    id: 'fallback-3', type: 'Course', title: 'AgileBA', cert: 'APMG',
    forWho: 'Business analysts, product owners, BAs moving into agile teams', duration: '2 days', format: 'Both', groupSize: 'Up to 12',
    objectives: ['Apply agile business analysis techniques across the delivery lifecycle', 'Understand the BA role within Scrum, DSDM, and hybrid contexts', 'Prepare for the AgileBA Foundation certification'],
    scheduledDates: [], description: 'The APMG certification for business analysts working in agile environments. Covers requirements, modelling, and stakeholder engagement — all grounded in agile values.',
  },
  {
    id: 'fallback-4', type: 'Course', title: 'Scrum Master', cert: 'Scrum Alliance',
    forWho: 'New and aspiring Scrum Masters, team leads, delivery managers', duration: '2 days', format: 'Both', groupSize: 'Up to 16',
    objectives: ['Understand the Scrum framework and the Scrum Master role', 'Facilitate Scrum ceremonies with confidence', 'Coach teams through common agile adoption challenges'],
    scheduledDates: [], description: 'A practical, scenario-led introduction to Scrum and the Scrum Master role. Less about memorising the framework, more about what to do when the team gets stuck.',
  },
  {
    id: 'fallback-5', type: 'Course', title: 'Product Owner', cert: 'Scrum Alliance',
    forWho: 'Product owners, product managers, business stakeholders', duration: '2 days', format: 'Both', groupSize: 'Up to 16',
    objectives: ['Define and manage a product backlog effectively', 'Prioritise using value-based techniques including MoSCoW and OKRs', 'Work with the team to deliver the right thing, not just a thing'],
    scheduledDates: [], description: 'For the people responsible for what gets built. Covers backlog management, stakeholder alignment, and prioritisation — with real scenarios from day one.',
  },
  {
    id: 'fallback-6', type: 'Masterclass', title: 'OKRs in Practice', cert: null,
    forWho: 'Leaders, heads of product, strategy and planning teams', duration: 'Half day', format: 'Both', groupSize: 'Up to 20',
    objectives: ['Understand what OKRs are — and what they aren\'t', 'Write Objectives and Key Results that actually drive behaviour', 'Connect OKRs to team-level delivery and agile planning'],
    scheduledDates: [], description: 'A focused half-day on OKRs — why most organisations get them wrong, and how to use them to create real alignment between strategy and delivery.',
  },
  {
    id: 'fallback-7', type: 'Workshop', title: 'Agile Fundamentals', cert: null,
    forWho: 'Anyone new to agile — any role, any sector', duration: '1 day', format: 'Both', groupSize: 'Up to 20',
    objectives: ['Understand the Agile Manifesto and what it means in practice', 'See how Scrum, Kanban, and DSDM relate to each other', 'Leave with one concrete thing to try on Monday'],
    scheduledDates: [], description: 'A practical one-day introduction to agile thinking and ways of working. No jargon, no certification pressure — just a grounded, honest introduction to why agile exists and how it works.',
  },
  {
    id: 'fallback-8', type: 'Workshop', title: 'Story Mapping', cert: null,
    forWho: 'Product teams, BAs, Scrum Masters, product owners', duration: 'Half day', format: 'Both', groupSize: 'Up to 16',
    objectives: ['Build a story map from scratch using the Jeff Patton approach', 'Slice releases around the thinnest viable user experience', 'Replace flat backlogs with a shared narrative the team can see'],
    scheduledDates: [], description: 'A hands-on workshop for teams who want to replace their flat backlog with something the whole team can see and reason about together.',
  },
];

// ─── Data hook ──────────────────────────────────────────────────────────────

// Fetch course catalogue from event_templates with nested events for date enrichment
const useCoursesCatalogue = () => {
  return useQuery({
    queryKey: ['courses-catalogue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select(`
          *,
          event_types:event_types!event_type_id(name),
          event_categories:event_categories!category_id(name),
          levels:levels!level_id(name),
          formats:formats!format_id(name),
          events:events!template_id(
            id, start_date, end_date, is_published, price_cents, currency, capacity, status
          )
        `)
        .order('title', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const durationLabel = (days: number | null) => {
  if (!days) return '—';
  if (days < 1) return 'Half day';
  return `${days} day${days > 1 ? 's' : ''}`;
};

// ─── MetaItem ───────────────────────────────────────────────────────────────
const MetaItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.muted, fontSize: 12 }}>
    <span style={{ color: p.midTeal }}>{icon}</span>
    <span>{label}</span>
  </div>
);

// ─── CourseCard ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, index }: { course: CourseItem; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const col = categoryColours[course.type] || categoryColours.Course;
  const hasDate = course.scheduledDates.length > 0;
  const firstDate = hasDate ? course.scheduledDates[0] : null;

  return (
    <div style={{ background: p.white, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,77,77,0.07)', position: 'relative' }}>

      {/* image band */}
      <div style={{ background: col.solid, height: 130, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -28, right: -28, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>{index + 1}</div>
        {hasDate ? (
          <div style={{ background: p.orange, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.CalendarCheck />{firstDate!.date}
            {course.scheduledDates.length > 1 && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '1px 6px', marginLeft: 2 }}>+{course.scheduledDates.length - 1}</span>}
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
            Dates TBC
          </div>
        )}
      </div>

      <div style={{ padding: '18px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* type + cert pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: col.pill, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{course.type}</span>
          {course.cert && (
            <span style={{ background: p.paleTeal, color: p.midTeal, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{course.cert}</span>
          )}
        </div>

        {/* title */}
        <Link to={hasDate ? `/events/${firstDate!.eventId}` : `/courses/${course.id}`} style={{ color: p.deepTeal, fontSize: 18, fontWeight: 800, lineHeight: 1.2, textDecoration: 'none', display: 'block' }}>{course.title}</Link>

        {/* description */}
        <div style={{ color: p.muted, fontSize: 13, lineHeight: 1.65 }}>{course.description}</div>

        {/* testimonial */}
        <EventCardQuote course={course.title} />

        {/* meta grid */}
        <div className="aa-card-meta" style={{ marginTop: 2 }}>
          <MetaItem icon={<Icons.Clock />} label={course.duration} />
          <MetaItem icon={<Icons.Users />} label={course.groupSize} />
          <MetaItem icon={course.format === 'Remote' ? <Icons.Monitor /> : <Icons.MapPin />} label={course.format === 'Both' ? 'In-person & remote' : course.format} />
          {course.cert && <MetaItem icon={<Icons.Certificate />} label={course.cert + ' certified'} />}
        </div>

        {/* for who */}
        {course.forWho && (
          <div style={{ background: col.light, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: p.body, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: col.pill }}>For: </span>{course.forWho}
          </div>
        )}

        {/* learning objectives - expandable */}
        {course.objectives.length > 0 && (
          <div>
            <button onClick={() => setExpanded((e) => !e)} style={{ background: 'none', border: 'none', padding: 0, color: p.midTeal, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {expanded ? 'Hide' : 'Show'} learning objectives
              <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
              </svg>
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

        {/* divider + CTAs */}
        <div style={{ borderTop: `1px solid ${p.paleTeal}`, paddingTop: 14, marginTop: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            to={hasDate ? `/events/${firstDate!.eventId}` : `/courses/${course.id}`}
            style={{ background: p.deepTeal, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', flex: 1, textDecoration: 'none', textAlign: 'center' }}
          >
            View details
          </Link>
          <Link
            to="/contact"
            style={{ background: 'none', border: `1px solid ${p.paleTeal}`, padding: '9px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', color: p.deepTeal, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <Icons.Chat />Enquire
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Filters ────────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Course', 'Workshop', 'Masterclass'];

// ─── Main component ─────────────────────────────────────────────────────────
const Events: React.FC = () => {
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState('All');

  const { data: rawTemplates, isError: catalogueError, refetch: refetchCatalogue } = useCoursesCatalogue();

  // Build the course list from Supabase data, or fallback
  const courses: CourseItem[] = useMemo(() => {
    if (!rawTemplates?.length) return FALLBACK_COURSES;

    // Only show published templates (gracefully handle missing column)
    const published = rawTemplates.filter((t: any) => t.is_published !== false);
    if (!published.length) return FALLBACK_COURSES;

    return published.map((t: any) => {
      const typeName = (t.event_types as any)?.name || 'Course';
      const formatName = (t.formats as any)?.name || 'Both';
      const durationDays = t.duration_days;

      // Derive scheduled dates from nested events (published + future only)
      const now = new Date();
      const events = (t.events || []) as any[];
      const scheduledDates = events
        .filter((e: any) => e.is_published && e.start_date && new Date(e.start_date) > now)
        .sort((a: any, b: any) => a.start_date.localeCompare(b.start_date))
        .map((e: any) => ({ date: formatDate(e.start_date), eventId: e.id }));

      // Derive cert body from template_tags or title
      let cert: string | null = null;
      const tags = (t.template_tags || []) as string[];
      if (tags.some((tag: string) => tag.toLowerCase().includes('apmg'))) cert = 'APMG';
      else if (tags.some((tag: string) => tag.toLowerCase().includes('scrum alliance'))) cert = 'Scrum Alliance';
      if (!cert) {
        const titleLower = t.title?.toLowerCase() || '';
        if (titleLower.includes('agilepm') || titleLower.includes('agileba') || titleLower.includes('agile digital')) cert = 'APMG';
        else if (titleLower.includes('scrum master') || titleLower.includes('product owner')) cert = 'Scrum Alliance';
      }

      return {
        id: t.id,
        type: typeName,
        title: t.title,
        cert,
        forWho: t.target_audience || '',
        duration: durationLabel(durationDays),
        format: formatName,
        groupSize: 'Up to 12',
        objectives: (t.learning_outcomes || []) as string[],
        description: t.short_description || (t.description ? (t.description.length > 160 ? t.description.slice(0, 160) + '...' : t.description) : ''),
        scheduledDates,
      };
    });
  }, [rawTemplates]);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return courses;
    return courses.filter((c) => c.type === activeFilter);
  }, [courses, activeFilter]);

  const scheduledCount = useMemo(() => courses.filter((c) => c.scheduledDates.length > 0).length, [courses]);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <Helmet>
        <title>Courses & Events — Altogether Agile</title>
        <meta name="description" content="Browse our catalogue of certified agile courses, workshops, and masterclasses. Scrum, Kanban, SAFe, and more." />
        <link rel="canonical" href={`${SITE_URL}/events`} />
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <Navigation />

      {/* ─── PAGE INTRO ─── */}
      <div id="main-content" style={{ background: '#006666', padding: isMobile ? '40px 20px 0' : '64px 48px 0' }}>
        <div className="aa-page-intro" style={{ paddingBottom: isMobile ? 0 : 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Courses &amp; Events</div>
            <h1 style={{ color: '#fff', fontSize: isMobile ? 32 : 46, fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
              Every course, run personally.<br />No associates. No surprises.
            </h1>
            <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              Browse the full catalogue below. Courses with a date scheduled show an orange badge — all others can be arranged for your team or organisation on request.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'flex-end', paddingBottom: isMobile ? 32 : 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Not sure where to start?</div>
              <p style={{ color: p.lightTeal, fontSize: 13, lineHeight: 1.6, margin: '0 0 14px' }}>Book a free 30-minute chemistry session and we'll work out the best fit together.</p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: p.orange, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', width: 'fit-content' }}
              >
                <Icons.Chat />Book a chemistry session
              </a>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {[
                { n: String(courses.length), label: 'Courses offered' },
                { n: String(scheduledCount), label: 'Dates scheduled' },
                { n: '1,500+', label: 'Practitioners trained' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ color: p.orange, fontSize: 22, fontWeight: 800 }}>{s.n}</div>
                  <div style={{ color: p.lightTeal, fontSize: 11 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILTER TABS */}
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {FILTERS.map((f) => {
            const count = f === 'All' ? courses.length : courses.filter((c) => c.type === f).length;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                aria-pressed={activeFilter === f}
                style={{
                  background: 'none', border: 'none',
                  padding: '16px 24px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  color: activeFilter === f ? p.orange : p.lightTeal,
                  borderBottom: activeFilter === f ? `3px solid ${p.orange}` : '3px solid transparent',
                  whiteSpace: 'nowrap',
                }}
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

      {/* ─── COURSE GRID ─── */}
      <div style={{ background: p.skyTeal, padding: isMobile ? '32px 20px' : '48px 48px' }}>
        {catalogueError ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: p.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: p.body }}>Failed to load courses. Please try again.</div>
            <button
              onClick={() => { refetchCatalogue(); }}
              style={{ background: p.deepTeal, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="aa-events-grid">
            {filtered.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ─── BESPOKE CTA ─── */}
      <div style={{ background: '#006666', padding: isMobile ? '40px 20px' : '56px 48px' }}>
        <div className="aa-bespoke">
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>In-house &amp; bespoke</div>
            <h2 style={{ color: '#fff', fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>Need it tailored for your team?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
              Every course can be delivered in-house — adapted to your context, your team size, and your organisation's way of working. Same quality, no generic materials.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Link
              to="/contact"
              style={{ background: p.orange, color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', textDecoration: 'none' }}
            >
              Book a conversation <Icons.ArrowRight />
            </Link>
            <div style={{ color: p.lightTeal, fontSize: 12, textAlign: 'center' }}>No hard sell. Just a conversation.</div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
};

export default Events;
