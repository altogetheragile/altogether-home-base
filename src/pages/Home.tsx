import { colors as p } from '@/theme/colors';
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import { useCourseCards } from '@/hooks/useCourseCards';
import { HomepageStrip } from '@/components/testimonials/TestimonialComponents';
import AboutSection from '@/components/AboutSection';
import { AlunTabletPortrait } from '@/components/AlunTabletPortrait';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// ─── Responsive CSS classes (media-query driven) ────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-hero-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
    .aa-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .aa-stats-bar { display: flex; align-items: stretch; justify-content: center; }
    .aa-section-pad { padding: 64px 48px; }
    .aa-hero-h1 { font-size: 50px; }
    .aa-hide-mobile { display: block; }

    @media (max-width: 767px) {
      .aa-hero-grid { grid-template-columns: 1fr; }
      .aa-three-col { grid-template-columns: 1fr; }
      .aa-stats-bar { flex-wrap: wrap; }
      .aa-stats-bar > div { width: 50%; border-right: none !important; }
      .aa-section-pad { padding: 40px 20px; }
      .aa-hero-h1 { font-size: 34px !important; }
      .aa-hide-mobile { display: none; }
    }
  `}</style>

);

// ─── Phosphor-style bold SVG icons (exact from reference) ───────────────────
const Icons = {
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,56a40,40,0,1,1-40,40A40,40,0,0,1,128,72Zm0,144a95.69,95.69,0,0,1-63.93-24.38C75.82,172.23,100.35,160,128,160s52.18,12.23,63.93,31.62A95.69,95.69,0,0,1,128,216Z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220ZM128,144a56,56,0,1,0-56-56A56.06,56.06,0,0,0,128,144Zm0,16c-30.67,0-58.7,12.36-79.49,34H207.49C186.7,172.36,158.67,160,128,160Z"/>
    </svg>
  ),
  Tag: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z"/>
    </svg>
  ),
  GraduationCap: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V117.87l16-8.81V192a8,8,0,0,0,16,0V96A8,8,0,0,0,251.76,88.94ZM128,175.89,41.91,128.39,128,80.13l86.09,48.26ZM208,192H48V127l72,40h0a8,8,0,0,0,3.76,1h.48A8,8,0,0,0,128,167l72-40Z"/>
    </svg>
  ),
  Books: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
      <path d="M231.65,194.53,198.28,39.06a16,16,0,0,0-19.21-12.19L132.78,37.31a16.08,16.08,0,0,0-12.19,19.22l4.33,20.29A16,16,0,0,0,112,72H48A16,16,0,0,0,32,88V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16v-1.56A15.92,15.92,0,0,0,231.65,194.53ZM168.27,41.14,204.93,213l-43.1,9.2L125.17,50.33ZM48,88h64v16H48Zm0,32h64v16H48Zm0,80V152h64v48Zm168,0H128V152h40a8,8,0,0,0,0-16H128V136h40a8,8,0,0,0,0-16H128V88h64Z"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
    </svg>
  ),
  Star: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
    </svg>
  ),
  Chat: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
      <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>
    </svg>
  ),
};

// ─── Main Component ─────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const isMobile = useIsMobile();
  const { settings } = useSiteSettings();
  const { data: courseCards } = useCourseCards();
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  const courses = courseCards || [];
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth <= 767) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  };
  const [visibleCount, setVisibleCount] = React.useState(getVisibleCount);
  React.useEffect(() => {
    const onResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const maxIndex = Math.max(0, courses.length - visibleCount);
  const canPrev = carouselIndex > 0;
  const canNext = carouselIndex < maxIndex;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <Helmet>
        <title>Altogether Agile — Agile Coaching & Training</title>
        <meta name="description" content="Certified agile courses, practical coaching, and 80+ techniques for teams who want real results. 25 years of hands-on experience." />
        <link rel="canonical" href={`${SITE_URL}/`} />
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <Navigation />

      {/* ─── HERO ─── */}
      <div style={{ position: 'relative', minHeight: 560, overflow: 'visible', border: 'none', boxShadow: 'none' }}>
        {/* Background image layer — extends through stats band */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: -80, backgroundImage: "url('/images/hero-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center 30%', backgroundRepeat: 'no-repeat', zIndex: 0 }} />
        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, padding: isMobile ? '48px 20px 80px' : '80px 48px 80px' }}>
          <div className="aa-hero-grid">
            <div>
              <h1 className="aa-hero-h1" style={{ color: p.deepTeal, fontWeight: 800, lineHeight: 1.4, margin: '0 0 20px' }}>
                Work better together.<br />Accelerate time to Value.
              </h1>
              <p style={{ color: p.body, fontSize: 16, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 480 }}>
                Practical agile training and coaching, grounded in 25 years of real experience. Still delivered personally, every time.
              </p>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <Link to="/events" style={{ background: p.orange, color: p.white, border: 'none', padding: '13px 26px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                  Browse Events <Icons.ArrowRight />
                </Link>
                {settings?.show_knowledge && (
                  <Link to="/knowledge" style={{ color: p.deepTeal, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                    Knowledge Base <Icons.ArrowRight />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div className="aa-stats-bar" style={{ background: 'transparent', padding: '20px 48px', paddingTop: 60, position: 'relative', zIndex: 2 }}>
        {[
          { icon: <Icons.Users />, num: '1,500+', label: 'Practitioners trained' },
          { icon: <Icons.Books />, num: '80+', label: 'Agile techniques' },
          { icon: <Icons.GraduationCap />, num: '12+', label: 'Frameworks covered' },
          { icon: <Icons.Star />, num: '4.9\u2605', label: 'Average rating' },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 40px' }}>
            <div style={{ color: p.orange, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ color: p.deepTeal, fontSize: 22, fontWeight: 800 }}>{stat.num}</div>
            <div style={{ color: p.deepTeal, fontSize: 12, opacity: 0.7 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ─── WHO IS THIS FOR ─── */}
      <div className="aa-section-pad" style={{ background: p.white, paddingTop: 56, paddingBottom: 48 }}>
        <h2 style={{ color: p.deepTeal, fontSize: 28, fontWeight: 800, margin: '0 0 32px', textAlign: 'center' }}>Who is this for?</h2>
        <div className="aa-three-col">
          {[
            { icon: <Icons.ArrowRight />, heading: 'Moving into agile', body: "You're a project manager, BA, or team lead transitioning to agile ways of working and need grounded, practical guidance - not just theory." },
            { icon: <Icons.GraduationCap />, heading: 'Seeking certification', body: "You want a grounded, framework-based course - Scrum, AgileBA, AgilePM, or Kanban - delivered by someone who has contributed to the frameworks and knows them inside out." },
            { icon: <Icons.Users />, heading: 'Building team agility', body: "You're a leader trying to grow genuine organisational agility - and you need a coach who understands both the human and structural side of change." },
          ].map((card, i) => (
            <div key={i} style={{ background: p.skyTeal, borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: p.deepTeal, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {card.icon}
              </div>
              <div style={{ color: p.deepTeal, fontSize: 17, fontWeight: 700 }}>{card.heading}</div>
              <div style={{ color: p.body, fontSize: 14, lineHeight: 1.65 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TESTIMONIALS STRIP ─── */}
      <HomepageStrip />

      {/* ─── EVENTS (live Supabase data) ─── */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: p.deepTeal, fontSize: 32, fontWeight: 800, margin: 0 }}>Courses, workshops and masterclasses</h2>
        </div>

        {/* Course carousel */}
        <div style={{ position: 'relative' }}>
          {canPrev && (
            <button
              onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
              aria-label="Previous courses"
              style={{
                position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
                zIndex: 2, width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: p.deepTeal, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,77,77,0.2)',
              }}
            >
              <Icons.ChevronLeft />
            </button>
          )}
          {canNext && (
            <button
              onClick={() => setCarouselIndex((i) => Math.min(maxIndex, i + 1))}
              aria-label="Next courses"
              style={{
                position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                zIndex: 2, width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: p.deepTeal, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,77,77,0.2)',
              }}
            >
              <Icons.ChevronRight />
            </button>
          )}

          <div style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${courses.length}, calc(${100 / visibleCount}% - ${(20 * (visibleCount - 1)) / visibleCount}px))`,
              gap: 20,
              transition: 'transform 0.35s ease',
              transform: `translateX(calc(-${carouselIndex} * (${100 / visibleCount}% + ${20 / visibleCount}px)))`,
            }}>
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  style={{
                    background: p.white, borderRadius: 14, padding: 24,
                    display: 'flex', flexDirection: 'column', gap: 14,
                    textDecoration: 'none', minHeight: 220,
                    boxShadow: '0 2px 12px rgba(0,77,77,0.07)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {course.category && (
                      <span style={{
                        background: p.deepTeal, color: '#fff', fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {course.category}
                      </span>
                    )}
                    {course.difficulty && (
                      <span style={{ color: p.midTeal, fontSize: 11, fontWeight: 600 }}>
                        {course.difficulty}
                      </span>
                    )}
                  </div>

                  <div style={{ color: p.deepTeal, fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>
                    {course.title}
                  </div>

                  {course.description && (
                    <div style={{ color: p.body, fontSize: 13, lineHeight: 1.6 }}>
                      {course.description.length > 100
                        ? course.description.slice(0, 100).trimEnd() + '\u2026'
                        : course.description}
                    </div>
                  )}

                  {course.hasDatesAvailable && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: p.midTeal, color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '4px 12px', borderRadius: 20, alignSelf: 'flex-start',
                    }}>
                      <Icons.Calendar /> Dates available
                    </span>
                  )}

                  <div style={{ marginTop: 'auto' }}>
                    <span style={{
                      color: p.orange, fontWeight: 700, fontSize: 13,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      Find out more <Icons.ArrowRight />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* View all CTA */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/events" style={{
            background: p.orange, color: '#fff', padding: '12px 24px',
            borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            View all →
          </Link>
        </div>
      </div>

      {/* ─── ABOUT ALUN ─── */}
      <AboutSection />

      {/* ─── KNOWLEDGE BASE ─── */}
      {settings?.show_knowledge && (
        <div className="aa-section-pad" style={{ background: p.deepTeal }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: p.lightTeal, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, marginBottom: 20 }}>
              <Icons.Books />Knowledge Base
            </div>
            <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>80+ agile techniques,<br />ready to use</h2>
            <p style={{ color: p.lightTeal, fontSize: 16, margin: '0 0 24px', lineHeight: 1.6, maxWidth: 560 }}>
              From Story Mapping to OKRs — every technique explained with purpose, usage, origins, and real examples. Searchable, filterable, and built for practitioners.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {['Story Mapping', 'OKRs', '5 Whys', 'Business Model Canvas', 'Impact Mapping', 'Retrospectives'].map((tag) => (
                <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: p.lightTeal, fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20 }}>
                  <Icons.Tag />{tag}
                </span>
              ))}
            </div>
            <Link to="/knowledge" style={{ background: p.orange, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              Browse Techniques <Icons.ArrowRight />
            </Link>
          </div>
        </div>
      )}

      {/* ─── CTA ─── */}
      <div className="aa-section-pad" style={{ background: p.orange }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 48, maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
              Ready to work with someone<br />who's been in the room?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 560 }}>
              Browse upcoming courses or book a free chemistry session to talk through what you need. No hard sell — just a conversation.
            </p>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <Link to="/events" style={{ background: p.deepTeal, color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                Browse Events <Icons.ArrowRight />
              </Link>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <Icons.Chat />Book a Chemistry Session
              </a>
            </div>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AlunTabletPortrait />
            </div>
          )}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <Footer />

    </div>
  );
};

export default Home;
