import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/site-settings';
import { getAllApprovedFeedback } from '@/lib/testimonials';
import { buildMetadata, JsonLd, breadcrumbJsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import { AlunTabletPortrait } from '@/components/AlunTabletPortrait';

export const dynamic = 'force-dynamic';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };
const BOOKING_URL = 'https://calendly.com/alundaviesbaker/30min';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'About Alun - Altogether Agile',
    description: 'Meet Alun, founder of Altogether Agile. 25 years of agile experience, ICF-accredited coach, and accredited Scrum trainer.',
    path: '/about',
  }),
  title: { absolute: 'About Alun - Altogether Agile' },
};

const ArrowRight = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" /></svg>;
const Chat = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z" /></svg>;
const CheckCircle = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" /></svg>;
const GraduationCap = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V117.87l16-8.81V192a8,8,0,0,0,16,0V96A8,8,0,0,0,251.76,88.94ZM128,175.89,41.91,128.39,128,80.13l86.09,48.26ZM208,192H48V127l72,40h0a8,8,0,0,0,3.76,1h.48A8,8,0,0,0,128,167l72-40Z" /></svg>;

const Heading = ({ label, title, light = false }: { label: string; title: string; light?: boolean }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ color: light ? p.lightTeal : p.orange, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <h2 style={{ color: light ? '#fff' : p.deepTeal, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h2>
  </div>
);

const timeline = [
  { year: 'Late 1990s', title: 'Starting with systems, not people', body: "Began in enterprise software - ERP implementations, data warehousing, systems analysis. Good technical grounding, but the most interesting problems were never the technical ones. They were the people ones." },
  { year: 'Early 2000s', title: 'First encounter with agile', body: "Working inside a large pharmaceutical organisation, I started experimenting with Scrum wrapped around DSDM for SAP rollouts - in environments where most people said it couldn't work. It did. That was the turning point." },
  { year: 'Mid 2000s', title: 'Leading teams, learning to coach', body: "Moved into team leadership and consulting roles. Quickly found that the hard part of agile adoption was never the framework - it was the dynamics. How teams make decisions. How they handle uncertainty. How leaders get out of the way. Started coaching before I had a word for it." },
  { year: '2016', title: 'Going independent', body: "Left the corporate world to run Altogether Agile full time. Started delivering Scrum and agile training alongside coaching and facilitation work. The goal from day one: practical, honest, grounded in real experience - not textbook agile." },
  { year: '2017 onwards', title: 'Building the training practice', body: "Developed affiliate training relationships and began delivering APMG-accredited courses - AgilePM, AgileBA, Agile Digital Services. Each course sharpened the conviction that certification only sticks when it's connected to real problems." },
  { year: '2020', title: 'Coaching, Westminster, and Management 3.0', body: "Formalised the coaching practice. Became a licensed Management 3.0 Facilitator. Took on a Visiting Lectureship at the University of Westminster. The pandemic forced everything online - and proved that good facilitation is about the room you create, not the room you're in." },
  { year: 'Now', title: 'Still in it', body: "Training, coaching, assessing, lecturing, and building the platform. In 2025 co-wrote the new version of AgilePM as one of the lead authors - the kind of work that only happens when you've been close to the practice long enough to have something worth saying. Still learning. Still finding it interesting." },
];

const philosophyCards = [
  { label: 'Training', heading: 'Learning that transfers.', colour: '#1A9090', lightBg: '#E6F5F5', body: "Most agile training fails not because people don't understand the concepts - but because they've never had to apply them under real conditions. Good training puts people in those conditions safely, with a facilitator who's been in the room for real.", principles: ['Scenario-led from the first session', 'Frameworks as tools, not religions', 'Certification as a by-product of learning, not the goal', 'Every technique connected to a real business problem'] },
  { label: 'Coaching', heading: 'Questions, not answers.', colour: '#6B5FCC', lightBg: '#EEECF9', body: "The best coaching conversations don't end with a solution handed over. They end with the person finding their own clarity - which means they own it, and they're more likely to act on it. My job is to ask the right questions, hold the space, and get out of the way.", principles: ['ICF-aligned approach throughout', 'Experience in the room, but not imposing it', "The coachee's agenda, not mine", "Honest feedback when it's asked for"] },
];

const credentials = [
  'Co-author - AgilePM (new version, 2025)', 'ABC Level-4 Specialist in agile training', 'Advanced Certified Scrum Master (A-CSM)', 'ABC Assessor - interviews professional membership candidates', 'AgileBA module author', 'Management 3.0 Facilitator', 'ICF-aligned coaching practice', 'STAR Manager Trainer', 'Visiting Lecturer, University of Westminster', 'SAFe 5 Agilist (elapsed)', 'Scrum Master (elapsed)',
];

const badges = [
  { src: '/images/badges/acc.webp', alt: 'Associate Certified Coach (ACC)', url: 'https://www.credly.com/badges/aaac0b7b-dbd7-4560-ad51-f8d89a84f6cf/public_url' },
  { src: '/images/badges/psm-ii.webp', alt: 'Professional Scrum Master II (PSM II)', url: 'https://www.credly.com/badges/ab193ca2-d233-48a2-a264-55ee82a819c2/public_url' },
  { src: '/images/badges/business-agility-catalyst.webp', alt: 'Business Agility Catalyst', url: 'https://www.credly.com/badges/2e963763-78d4-43ba-92f4-3ce262e5f8b7/public_url' },
];

function Stars({ rating }: { rating: number | null }) {
  const filled = Math.round(((rating ?? 10) / 10) * 5);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={12} height={12} viewBox="0 0 256 256" fill={i < filled ? p.orange : p.paleTeal}><path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z" /></svg>
      ))}
    </div>
  );
}

export default async function AboutPage() {
  const [settings, feedback] = await Promise.all([getSiteSettings(), getAllApprovedFeedback()]);
  const firstNameOnly = settings.show_testimonial_first_name_only ?? false;
  const quotes = [...feedback].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3);
  const name = (f: { first_name: string; last_name: string }) => (firstNameOnly ? f.first_name : `${f.first_name} ${f.last_name}`.trim());

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: 'Alun Davies-Baker', jobTitle: 'Agile Coach and Trainer', description: 'Founder of Altogether Agile, with 25 years of hands-on agile experience as an ICF-accredited coach and accredited Scrum trainer.', url: `${SITE_URL}/about`, image: `${SITE_URL}/images/alun.webp`, worksFor: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL } } }} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />

      <style>{`
        .aa-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
        .aa-two-col-wide { display: grid; grid-template-columns: 1fr 340px; gap: 56px; align-items: start; }
        .aa-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .aa-section-pad { padding: 64px 48px; }
        .aa-about-hero { padding: 72px 48px 60px; }
        .aa-about-cta { padding: 56px 48px; }
        .aa-hide-mobile { display: flex; }
        @media (max-width: 767px) {
          .aa-two-col { grid-template-columns: 1fr; gap: 32px; }
          .aa-two-col-wide { grid-template-columns: 1fr; gap: 32px; }
          .aa-three-col { grid-template-columns: 1fr; }
          .aa-section-pad { padding: 40px 20px; }
          .aa-about-hero { padding: 48px 20px 40px; }
          .aa-about-cta { padding: 40px 20px; }
          .aa-hide-mobile { display: none; }
        }
      `}</style>

      {/* HERO */}
      <div id="main-content" className="aa-about-hero" style={{ background: '#006666' }}>
        <div className="aa-two-col" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>About</div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(34px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px' }}>25 years in.<br />Still learning.</h1>
            <p style={{ color: p.lightTeal, fontSize: 17, lineHeight: 1.75, margin: '0 0 28px', maxWidth: 480 }}>I&apos;m Alun - founder of Altogether Agile, agile practitioner, trainer, coach, and Visiting Lecturer, University of Westminster. This page is about where I&apos;ve come from, what I believe, and why I built this.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['London-based', '25+ years experience', '1,500+ trained', 'ABC Assessor'].map((tag) => (
                <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', color: p.lightTeal, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/alun.webp" alt="Alun Davies-Baker, founder of Altogether Agile" loading="lazy" style={{ width: '65%', height: 'auto', display: 'block', borderRadius: 16 }} />
          </div>
        </div>
      </div>

      {/* PERSONAL STORY */}
      <div className="aa-section-pad" style={{ background: p.white }}>
        <div className="aa-two-col-wide">
          <div>
            <Heading label="The story" title="How I got here." />
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: '0 0 18px' }}>I didn&apos;t set out to be an agile trainer. I started as a graduate trainee at SSA after a Masters at UMIST, writing code for ERP systems on AS400. What followed was fifteen years at Boehringer Ingelheim - moving from systems analyst to Head of IS Consulting to leading a global SAP deployment across six countries.</p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: '0 0 18px' }}>It was inside Boehringer that I first got serious about agile - pioneering a Scrum-wrapped-with-DSDM approach to enterprise SAP rollouts at a time when most organisations considered the two incompatible. It worked. Not perfectly, but well enough to prove the point.</p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: '0 0 18px' }}>In 2016 I went independent, founding Altogether Agile and building a training and coaching practice from the ground up. I&apos;ve worked as an affiliate trainer with QA, Metadata Training, and TCC; as a Scrum Master and Assessor at the Agile Business Consortium; and as a Visiting Lecturer at the University of Westminster since 2020.</p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: 0 }}>Altogether Agile is now the centre of gravity - training, coaching, knowledge base, and platform in one place. One person, nearly 30 years of experience, and a genuine belief that agile works when it&apos;s taught and coached by someone who&apos;s actually done it.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: p.skyTeal, borderRadius: 14, padding: 24 }}>
              <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><GraduationCap />Credentials</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {credentials.map((cred) => (
                  <div key={cred} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: p.body, fontSize: 13, lineHeight: 1.5 }}>
                    <span style={{ color: p.orange, flexShrink: 0, marginTop: 1 }}><CheckCircle /></span>{cred}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${p.paleTeal}` }}>
                <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 13, marginBottom: 12 }}>Verified Badges</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {badges.map((badge) => (
                    <a key={badge.src} href={badge.url} target="_blank" rel="noopener noreferrer" title={badge.alt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0, padding: 6 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={badge.src} alt={badge.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: p.deepTeal, borderRadius: 14, padding: 24 }}>
              <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Work with me</div>
              <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.65, margin: '0 0 16px' }}>Not sure where to start? A chemistry session is a free 30-minute conversation - no agenda, no commitment.</p>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: p.orange, color: '#fff', padding: '11px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, width: '100%', textDecoration: 'none', boxSizing: 'border-box', justifyContent: 'center' }}><Chat />Book a chemistry session</a>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      {quotes.length > 0 && (
        <div className="aa-section-pad" style={{ background: p.skyTeal }}>
          <Heading label="Feedback" title="What people say." />
          <div className="aa-three-col">
            {quotes.map((q) => (
              <div key={q.id} style={{ background: p.white, borderRadius: 14, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Stars rating={q.rating} />
                <div style={{ color: p.body, fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>&ldquo;{q.comment}&rdquo;</div>
                <div>
                  <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13 }}>{name(q)}</div>
                  <div style={{ color: p.muted, fontSize: 12 }}>{q.job_title}{q.job_title && q.company ? ' · ' : ''}{q.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MISSION */}
      <div className="aa-section-pad" style={{ background: '#006666' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <Heading label="Why Altogether Agile exists" title="The mission." light />
          <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.85, margin: '0 0 20px' }}>Most agile training is too abstract. It describes frameworks without connecting them to real problems. It teaches ceremonies without explaining why they exist. It certifies people who leave the course without knowing what to do on Monday morning.</p>
          <p style={{ color: '#fff', fontSize: 16, lineHeight: 1.85, margin: '0 0 20px', fontWeight: 500 }}>Altogether Agile exists to close that gap. That means every technique connects to a real decision, not a hypothetical one - and every session ends with something concrete enough to act on.</p>
          <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.85, margin: 0 }}>Every course, every coaching conversation, and every technique in the knowledge base is designed to be immediately usable - not a concept to be filed away for later. That means real scenarios, honest facilitation, and a trainer who&apos;s been in the room for real.</p>
        </div>
      </div>

      {/* PHILOSOPHY */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <Heading label="How I work" title="Training and coaching philosophy." />
        <div className="aa-two-col" style={{ gap: 24 }}>
          {philosophyCards.map((card) => (
            <div key={card.label} style={{ background: p.white, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: card.lightBg, padding: '20px 28px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: card.colour, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{card.label}</div>
                <div style={{ color: p.deepTeal, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{card.heading}</div>
              </div>
              <div style={{ padding: '24px 28px 28px' }}>
                <p style={{ color: p.body, fontSize: 14, lineHeight: 1.8, margin: '0 0 20px' }}>{card.body}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {card.principles.map((principle) => (
                    <div key={principle} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: p.body, fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: card.colour, flexShrink: 0, marginTop: 1 }}><CheckCircle /></span>{principle}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="aa-section-pad" style={{ background: p.white }}>
        <Heading label="Career" title="How it unfolded." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 680 }}>
          {timeline.map((item, i) => (
            <div key={item.year} style={{ display: 'flex', gap: 24, position: 'relative' }}>
              {i < timeline.length - 1 && <div style={{ position: 'absolute', left: 19, top: 40, bottom: -8, width: 2, background: p.paleTeal }} />}
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: i === timeline.length - 1 ? p.orange : p.deepTeal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, fontSize: 10, fontWeight: 700 }}>
                {i === timeline.length - 1 ? 'Now' : <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div style={{ background: p.skyTeal, borderRadius: 12, padding: '16px 20px', marginBottom: 8, flex: 1 }}>
                <div style={{ color: p.orange, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.year}</div>
                <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{item.title}</div>
                <div style={{ color: p.body, fontSize: 13, lineHeight: 1.7 }}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="aa-about-cta" style={{ background: p.deepTeal }}>
        <div className="aa-two-col" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Work with Altogether Agile</div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>Ready to work with someone who&apos;s been in the room?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.75, margin: '0 0 24px' }}>Browse upcoming courses, explore the knowledge base, or book a free chemistry session to talk through what you need.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: p.orange, color: '#fff', padding: '13px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}><Chat />Book a chemistry session</a>
              {settings.show_events !== false && <Link href="/events" style={{ color: p.lightTeal, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>Browse Events <ArrowRight /></Link>}
              {settings.show_knowledge && <Link href="/knowledge" style={{ color: p.lightTeal, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>Knowledge Base <ArrowRight /></Link>}
            </div>
          </div>
          <div className="aa-hide-mobile" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <AlunTabletPortrait />
          </div>
        </div>
      </div>
    </div>
  );
}
