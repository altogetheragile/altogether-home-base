import type { Metadata } from 'next';
import Link from 'next/link';
import './home.css';
import { getSiteSettings } from '@/lib/site-settings';
import { getHomeCourseCards, getHomeTestimonials } from '@/lib/home';
import { buildMetadata, JsonLd, organizationJsonLd } from '@/lib/seo';
import { HomeCarousel } from './HomeCarousel';
import { HomeTestimonials } from './HomeTestimonials';
import AboutSection from '@/components/AboutSection';
import { AlunTabletPortrait } from '@/components/AlunTabletPortrait';

export const dynamic = 'force-dynamic';

const TITLE = 'Altogether Agile - Agile Coaching & Training';
const DESC =
  'Framework-based agile training and coaching, with 80+ techniques and 25 years of hands-on experience for teams who want real results.';
const BOOKING_URL = 'https://calendly.com/alundaviesbaker/30min';

export const metadata: Metadata = {
  ...buildMetadata({ title: TITLE, description: DESC, path: '/' }),
  // Absolute title so the layout's "%s - Altogether Agile" template is not applied.
  title: { absolute: TITLE },
};

const Icons = {
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" /></svg>,
  Users: () => <svg width="36" height="36" viewBox="0 0 256 256" fill="currentColor"><path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z" /></svg>,
  Books: () => <svg width="36" height="36" viewBox="0 0 256 256" fill="currentColor"><path d="M231.65,194.53,198.28,39.06a16,16,0,0,0-19.21-12.19L132.78,37.31a16.08,16.08,0,0,0-12.19,19.22l4.33,20.29A16,16,0,0,0,112,72H48A16,16,0,0,0,32,88V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16v-1.56A15.92,15.92,0,0,0,231.65,194.53ZM168.27,41.14,204.93,213l-43.1,9.2L125.17,50.33ZM48,88h64v16H48Zm0,32h64v16H48Zm0,80V152h64v48Zm168,0H128V152h40a8,8,0,0,0,0-16H128V136h40a8,8,0,0,0,0-16H128V88h64Z" /></svg>,
  GraduationCap: () => <svg width="36" height="36" viewBox="0 0 256 256" fill="currentColor"><path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V117.87l16-8.81V192a8,8,0,0,0,16,0V96A8,8,0,0,0,251.76,88.94ZM128,175.89,41.91,128.39,128,80.13l86.09,48.26ZM208,192H48V127l72,40h0a8,8,0,0,0,3.76,1h.48A8,8,0,0,0,128,167l72-40Z" /></svg>,
  Star: () => <svg width="36" height="36" viewBox="0 0 256 256" fill="currentColor"><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z" /></svg>,
  Tag: () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z" /></svg>,
  Chat: () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z" /></svg>,
};

export default async function HomePage() {
  const [settings, courses, testimonials] = await Promise.all([
    getSiteSettings(),
    getHomeCourseCards(),
    getHomeTestimonials(),
  ]);
  const showKnowledge = !!settings.show_knowledge;
  const firstNameOnly = settings.show_testimonial_first_name_only ?? false;

  return (
    <div className="aa-page">
      <JsonLd data={organizationJsonLd()} />
      <main id="main-content">
        {/* HERO */}
        <div className="aa-hero">
          <div className="aa-hero-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/hero-bg-1920.webp" srcSet="/images/hero-bg-1024.webp 1024w, /images/hero-bg-1920.webp 1920w, /images/hero-bg-2880.webp 2880w" sizes="100vw" alt="" fetchPriority="high" width={2400} height={1200} />
          </div>
          <div className="aa-hero-content">
            <div className="aa-hero-grid">
              <div>
                <h1 className="aa-hero-h1">Work better together.<br />Accelerate time to value.</h1>
                <p className="aa-hero-subtitle">Practical agile training and coaching, grounded in 25 years of real experience. Still delivered personally, every time.</p>
                <div className="aa-hero-actions">
                  <Link href="/events" className="aa-btn aa-btn--primary">Browse Events <Icons.ArrowRight /></Link>
                  {showKnowledge && <Link href="/knowledge" className="aa-btn aa-btn--ghost">Knowledge Base <Icons.ArrowRight /></Link>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="aa-stats-bar">
          {[
            { icon: <Icons.Users />, num: '1,500+', label: 'Practitioners trained' },
            { icon: <Icons.Books />, num: '80+', label: 'Agile techniques' },
            { icon: <Icons.GraduationCap />, num: '12+', label: 'Frameworks covered' },
            { icon: <Icons.Star />, num: '4.9★', label: 'Average rating' },
          ].map((s) => (
            <div key={s.label} className="aa-stat">
              <div className="aa-stat__icon">{s.icon}</div>
              <div className="aa-stat__num">{s.num}</div>
              <div className="aa-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* WHO IS THIS FOR */}
        <div className="aa-section-pad" style={{ background: 'var(--aa-white)', paddingTop: 56, paddingBottom: 48 }}>
          <h2 className="aa-section-heading aa-section-heading--center">Who is this for?</h2>
          <div className="aa-three-col">
            {[
              { heading: 'Moving into agile', body: "You're a project manager, BA, or team lead transitioning to agile ways of working and need grounded, practical guidance - not just theory." },
              { heading: 'Seeking certification', body: 'You want a grounded, framework-based course - Scrum, AgileBA, AgilePM, or Kanban - delivered by someone who has contributed to the frameworks and knows them inside out.' },
              { heading: 'Building team agility', body: "You're a leader trying to grow genuine organisational agility - and you need a coach who understands both the human and structural side of change." },
            ].map((card) => (
              <div key={card.heading} className="aa-persona-card">
                <div className="aa-persona-card__icon"><Icons.ArrowRight /></div>
                <div className="aa-persona-card__heading">{card.heading}</div>
                <div className="aa-persona-card__body">{card.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIALS */}
        <HomeTestimonials items={testimonials} firstNameOnly={firstNameOnly} />

        {/* COURSES */}
        <div className="aa-section-pad" style={{ background: 'var(--aa-sky-teal)' }}>
          <div className="aa-mb-32">
            <h2 className="aa-section-heading aa-section-heading--lg">Courses, workshops and masterclasses</h2>
          </div>
          {courses.length > 0 ? (
            <HomeCarousel courses={courses} />
          ) : (
            <div className="aa-error-box">
              <p className="aa-error-box__title">Unable to load courses</p>
              <p className="aa-error-box__msg">Please try refreshing the page.</p>
            </div>
          )}
          <div className="aa-text-center aa-mt-32">
            <Link href="/events" className="aa-btn aa-btn--primary-sm">View all →</Link>
          </div>
        </div>

        {/* ABOUT ALUN */}
        <AboutSection />

        {/* KNOWLEDGE BASE */}
        {showKnowledge && (
          <div className="aa-section-pad" style={{ background: 'var(--aa-deep-teal)' }}>
            <div>
              <div className="aa-kb-badge"><Icons.Books />Knowledge Base</div>
              <h2 className="aa-kb-heading">80+ agile techniques,<br />ready to use</h2>
              <p className="aa-kb-body">From Story Mapping to OKRs - every technique explained with purpose, usage, origins, and real examples. Searchable, filterable, and built for practitioners.</p>
              <div className="aa-kb-tags">
                {['Story Mapping', 'OKRs', '5 Whys', 'Business Model Canvas', 'Impact Mapping', 'Retrospectives'].map((tag) => (
                  <span key={tag} className="aa-kb-tag"><Icons.Tag />{tag}</span>
                ))}
              </div>
              <Link href="/knowledge" className="aa-btn aa-btn--primary-sm">Browse Techniques <Icons.ArrowRight /></Link>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="aa-section-pad" style={{ background: 'var(--aa-orange)' }}>
          <div className="aa-cta-banner">
            <div className="aa-cta-banner__text">
              <h2 className="aa-cta-banner__heading">Ready to work with someone<br />who&apos;s been in the room?</h2>
              <p className="aa-cta-banner__body">Browse upcoming courses or book a free chemistry session to talk through what you need. No hard sell - just a conversation.</p>
              <div className="aa-cta-banner__actions">
                <Link href="/events" className="aa-btn aa-btn--deep">Browse Events <Icons.ArrowRight /></Link>
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="aa-btn aa-btn--ghost-light"><Icons.Chat />Book a Chemistry Session</a>
              </div>
            </div>
            <div className="aa-hide-mobile" style={{ display: 'flex', justifyContent: 'center' }}>
              <AlunTabletPortrait />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
