import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import { OrganizationSchema } from '@/components/seo/JsonLd';
import { useCourseCards } from '@/hooks/useCourseCards';
import { HomepageStrip } from '@/components/testimonials/TestimonialComponents';
import AboutSection from '@/components/AboutSection';
import { AlunTabletPortrait } from '@/components/AlunTabletPortrait';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import './Home.css';

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
  const { data: courseCards, isLoading: coursesLoading, error: coursesError } = useCourseCards();
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  const courses = React.useMemo(() => courseCards || [], [courseCards]);

  const getVisibleCount = React.useCallback(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth <= 767) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }, []);
  const [visibleCount, setVisibleCount] = React.useState(getVisibleCount);
  React.useEffect(() => {
    const onResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getVisibleCount]);

  const maxIndex = React.useMemo(() => Math.max(0, courses.length - visibleCount), [courses.length, visibleCount]);
  const canPrev = carouselIndex > 0;
  const canNext = carouselIndex < maxIndex;

  return (
    <div className="aa-page">
      <Helmet>
        <title>Altogether Agile — Agile Coaching & Training</title>
        <meta name="description" content="Certified agile courses, practical coaching, and 80+ techniques for teams who want real results. 25 years of hands-on experience." />
        <meta property="og:title" content="Altogether Agile — Agile Coaching & Training" />
        <meta property="og:description" content="Certified agile courses, practical coaching, and 80+ techniques for teams who want real results." />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${SITE_URL}/`} />
      </Helmet>
      <OrganizationSchema />

      {/* ─── NAV ─── */}
      <Navigation />

      <main id="main-content">
      {/* ─── HERO ─── */}
      <div className="aa-hero">
        <div className="aa-hero-bg">
          <img src="/images/hero-bg.webp" alt="" fetchPriority="high" width="1380" height="648" />
        </div>
        <div className={`aa-hero-content${isMobile ? ' aa-hero-content--mobile' : ''}`}>
          <div className="aa-hero-grid">
            <div>
              <h1 className="aa-hero-h1">
                Work better together.<br />Accelerate time to Value.
              </h1>
              <p className="aa-hero-subtitle">
                Practical agile training and coaching, grounded in 25 years of real experience. Still delivered personally, every time.
              </p>
              <div className="aa-hero-actions">
                <Link to="/events" className="aa-btn aa-btn--primary">
                  Browse Events <Icons.ArrowRight />
                </Link>
                {settings?.show_knowledge && (
                  <Link to="/knowledge" className="aa-btn aa-btn--ghost">
                    Knowledge Base <Icons.ArrowRight />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div className="aa-stats-bar">
        {[
          { icon: <Icons.Users />, num: '1,500+', label: 'Practitioners trained' },
          { icon: <Icons.Books />, num: '80+', label: 'Agile techniques' },
          { icon: <Icons.GraduationCap />, num: '12+', label: 'Frameworks covered' },
          { icon: <Icons.Star />, num: '4.9★', label: 'Average rating' },
        ].map((stat, i) => (
          <div key={i} className="aa-stat">
            <div className="aa-stat__icon">{stat.icon}</div>
            <div className="aa-stat__num">{stat.num}</div>
            <div className="aa-stat__label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ─── WHO IS THIS FOR ─── */}
      <div className="aa-section-pad" style={{ background: 'var(--aa-white)', paddingTop: 56, paddingBottom: 48 }}>
        <h2 className="aa-section-heading aa-section-heading--center">Who is this for?</h2>
        <div className="aa-three-col">
          {[
            { icon: <Icons.ArrowRight />, heading: 'Moving into agile', body: "You're a project manager, BA, or team lead transitioning to agile ways of working and need grounded, practical guidance - not just theory." },
            { icon: <Icons.GraduationCap />, heading: 'Seeking certification', body: "You want a grounded, framework-based course - Scrum, AgileBA, AgilePM, or Kanban - delivered by someone who has contributed to the frameworks and knows them inside out." },
            { icon: <Icons.Users />, heading: 'Building team agility', body: "You're a leader trying to grow genuine organisational agility - and you need a coach who understands both the human and structural side of change." },
          ].map((card, i) => (
            <div key={i} className="aa-persona-card">
              <div className="aa-persona-card__icon">
                {card.icon}
              </div>
              <div className="aa-persona-card__heading">{card.heading}</div>
              <div className="aa-persona-card__body">{card.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TESTIMONIALS STRIP ─── */}
      <HomepageStrip />

      {/* ─── EVENTS (live Supabase data) ─── */}
      <div className="aa-section-pad" style={{ background: 'var(--aa-sky-teal)' }}>
        <div className="aa-mb-32">
          <h2 className="aa-section-heading aa-section-heading--lg">Courses, workshops and masterclasses</h2>
        </div>

        {/* Course carousel */}
        {coursesLoading ? (
          <div className="aa-three-col">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aa-skeleton-card">
                <div className="aa-skeleton-bar aa-skeleton-bar--badge" />
                <div className="aa-skeleton-bar aa-skeleton-bar--title" />
                <div className="aa-skeleton-bar--line" />
                <div className="aa-skeleton-bar--line-short" />
              </div>
            ))}
          </div>
        ) : coursesError ? (
          <div className="aa-error-box">
            <p className="aa-error-box__title">Unable to load courses</p>
            <p className="aa-error-box__msg">Please try refreshing the page.</p>
          </div>
        ) : (
        <div style={{ position: 'relative' }}>
          {canPrev && (
            <button
              onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
              aria-label="Previous courses"
              className="aa-carousel-btn aa-carousel-btn--prev"
            >
              <Icons.ChevronLeft />
            </button>
          )}
          {canNext && (
            <button
              onClick={() => setCarouselIndex((i) => Math.min(maxIndex, i + 1))}
              aria-label="Next courses"
              className="aa-carousel-btn aa-carousel-btn--next"
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
                  className="aa-course-card"
                >
                  <div className="aa-course-card__header">
                    {course.category && (
                      <span className="aa-badge aa-badge--deep">
                        {course.category}
                      </span>
                    )}
                    {course.difficulty && (
                      <span className="aa-badge--difficulty">
                        {course.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="aa-course-card__title">
                    {course.title}
                  </div>

                  {course.description && (
                    <div className="aa-course-card__desc">
                      {course.description.length > 100
                        ? course.description.slice(0, 100).trimEnd() + '…'
                        : course.description}
                    </div>
                  )}

                  {course.hasDatesAvailable && (
                    <span className="aa-badge aa-badge--dates">
                      <Icons.Calendar /> Dates available
                    </span>
                  )}

                  <div className="aa-course-card__cta">
                    <span>Find out more <Icons.ArrowRight /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* View all CTA */}
        <div className="aa-text-center aa-mt-32">
          <Link to="/events" className="aa-btn aa-btn--primary-sm">
            View all →
          </Link>
        </div>
      </div>

      {/* ─── ABOUT ALUN ─── */}
      <AboutSection />

      {/* ─── KNOWLEDGE BASE ─── */}
      {settings?.show_knowledge && (
        <div className="aa-section-pad" style={{ background: 'var(--aa-deep-teal)' }}>
          <div>
            <div className="aa-kb-badge">
              <Icons.Books />Knowledge Base
            </div>
            <h2 className="aa-kb-heading">80+ agile techniques,<br />ready to use</h2>
            <p className="aa-kb-body">
              From Story Mapping to OKRs — every technique explained with purpose, usage, origins, and real examples. Searchable, filterable, and built for practitioners.
            </p>
            <div className="aa-kb-tags">
              {['Story Mapping', 'OKRs', '5 Whys', 'Business Model Canvas', 'Impact Mapping', 'Retrospectives'].map((tag) => (
                <span key={tag} className="aa-kb-tag">
                  <Icons.Tag />{tag}
                </span>
              ))}
            </div>
            <Link to="/knowledge" className="aa-btn aa-btn--primary-sm">
              Browse Techniques <Icons.ArrowRight />
            </Link>
          </div>
        </div>
      )}

      {/* ─── CTA ─── */}
      <div className="aa-section-pad" style={{ background: 'var(--aa-orange)' }}>
        <div className="aa-cta-banner">
          <div className="aa-cta-banner__text">
            <h2 className="aa-cta-banner__heading">
              Ready to work with someone<br />who's been in the room?
            </h2>
            <p className="aa-cta-banner__body">
              Browse upcoming courses or book a free chemistry session to talk through what you need. No hard sell — just a conversation.
            </p>
            <div className="aa-cta-banner__actions">
              <Link to="/events" className="aa-btn aa-btn--deep">
                Browse Events <Icons.ArrowRight />
              </Link>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="aa-btn aa-btn--ghost-light">
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

      </main>

      {/* ─── FOOTER ─── */}
      <Footer />

    </div>
  );
};

export default Home;
