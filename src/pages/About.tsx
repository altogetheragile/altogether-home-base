import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import { AboutSidebarQuotes } from '@/components/testimonials/TestimonialComponents';
import { AlunTabletPortrait } from '@/components/AlunTabletPortrait';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { colors as p } from '@/theme/colors';

// ─── Responsive CSS classes (media-query driven) ────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
    .aa-two-col-wide { display: grid; grid-template-columns: 1fr 340px; gap: 56px; align-items: start; }
    .aa-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .aa-section-pad { padding: 64px 48px; }
    .aa-timeline-line { display: block; }
    .aa-feedback-row > div { flex-direction: row !important; gap: 24px !important; }
    .aa-feedback-row > div > div:first-child { display: none; }
    .aa-feedback-row > div > div { flex: 1; }

    @media (max-width: 767px) {
      .aa-feedback-row > div { flex-direction: column !important; }
      .aa-two-col { grid-template-columns: 1fr; gap: 32px; }
      .aa-two-col-wide { grid-template-columns: 1fr; gap: 32px; }
      .aa-three-col { grid-template-columns: 1fr; }
      .aa-section-pad { padding: 40px 20px; }
    }
  `}</style>
);

// ─── Phosphor-style bold SVG icons (exact from reference) ───────────────────
const Icons = {
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
    </svg>
  ),
  Chat: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
    </svg>
  ),
  GraduationCap: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V117.87l16-8.81V192a8,8,0,0,0,16,0V96A8,8,0,0,0,251.76,88.94ZM128,175.89,41.91,128.39,128,80.13l86.09,48.26ZM208,192H48V127l72,40h0a8,8,0,0,0,3.76,1h.48A8,8,0,0,0,128,167l72-40Z"/>
    </svg>
  ),
};

// ─── Section heading ────────────────────────────────────────────────────────
const SectionHeading = ({ label, title, light = false }: { label: string; title: string; light?: boolean }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ color: light ? p.lightTeal : p.orange, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <h2 style={{ color: light ? '#fff' : p.deepTeal, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h2>
  </div>
);


// ─── Static data ────────────────────────────────────────────────────────────
const timeline = [
  { year: 'Late 1990s', title: 'Starting with systems, not people', body: "Began in enterprise software — ERP implementations, data warehousing, systems analysis. Good technical grounding, but the most interesting problems were never the technical ones. They were the people ones." },
  { year: 'Early 2000s', title: 'First encounter with agile', body: "Working inside a large pharmaceutical organisation, I started experimenting with Scrum wrapped around DSDM for SAP rollouts — in environments where most people said it couldn't work. It did. That was the turning point." },
  { year: 'Mid 2000s', title: 'Leading teams, learning to coach', body: "Moved into team leadership and consulting roles. Quickly found that the hard part of agile adoption was never the framework — it was the dynamics. How teams make decisions. How they handle uncertainty. How leaders get out of the way. Started coaching before I had a word for it." },
  { year: '2016', title: 'Going independent', body: "Left the corporate world to run Altogether Agile full time. Started delivering Scrum and agile training alongside coaching and facilitation work. The goal from day one: practical, honest, grounded in real experience — not textbook agile." },
  { year: '2017 onwards', title: 'Building the training practice', body: "Developed affiliate training relationships and began delivering certified APMG courses — AgilePM, AgileBA, Agile Digital Services. Each course sharpened the conviction that certification only sticks when it's connected to real problems." },
  { year: '2020', title: 'Coaching, Westminster, and Management 3.0', body: "Formalised the coaching practice. Became a licensed Management 3.0 Facilitator. Took on a Visiting Lectureship at the University of Westminster. The pandemic forced everything online — and proved that good facilitation is about the room you create, not the room you're in." },
  { year: 'Now', title: 'Still in it', body: "Training, coaching, assessing, lecturing, and building the platform. In 2025 co-wrote the new version of AgilePM as one of the lead authors — the kind of work that only happens when you've been close to the practice long enough to have something worth saying. Still learning. Still finding it interesting." },
];

const philosophyCards = [
  {
    label: 'Training',
    heading: 'Learning that transfers.',
    colour: '#1A9090',
    lightBg: '#E6F5F5',
    body: "Most agile training fails not because people don't understand the concepts — but because they've never had to apply them under real conditions. Good training puts people in those conditions safely, with a facilitator who's been in the room for real.",
    principles: [
      'Scenario-led from the first session',
      'Frameworks as tools, not religions',
      'Certification as a by-product of learning, not the goal',
      'Every technique connected to a real business problem',
    ],
  },
  {
    label: 'Coaching',
    heading: 'Questions, not answers.',
    colour: '#6B5FCC',
    lightBg: '#EEECF9',
    body: "The best coaching conversations don't end with a solution handed over. They end with the person finding their own clarity — which means they own it, and they're more likely to act on it. My job is to ask the right questions, hold the space, and get out of the way.",
    principles: [
      'ICF-aligned approach throughout',
      "Experience in the room, but not imposing it",
      "The coachee's agenda, not mine",
      "Honest feedback when it's asked for",
    ],
  },
];

const credentials = [
  'Lead author — AgilePM (new version, 2025)',
  'ABC Level-4 Specialist in agile training',
  'Advanced Certified Scrum Master (A-CSM)',
  'ABC Assessor - interviews professional membership candidates',
  'AgileBA module author',
  'Management 3.0 Licensed Facilitator',
  'ICF-aligned coaching practice',
  'STAR Manager Trainer',
  'Visiting Lecturer, University of Westminster',
];

// ─── Component ──────────────────────────────────────────────────────────────
const About: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <Helmet>
        <title>About Alun — Altogether Agile</title>
        <meta name="description" content="Meet Alun, founder of Altogether Agile. 25 years of agile experience, ICF-accredited coach, and certified Scrum trainer." />
        <link rel="canonical" href={`${SITE_URL}/about`} />
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <Navigation />

      {/* ─── HERO ─── */}
      <div id="main-content" style={{ background: '#006666', padding: isMobile ? '48px 20px 40px' : '72px 48px 60px' }}>
        <div className="aa-two-col" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>About</div>
            <h1 style={{ color: '#fff', fontSize: isMobile ? 34 : 48, fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px' }}>
              25 years in.<br />Still learning.
            </h1>
            <p style={{ color: p.lightTeal, fontSize: 17, lineHeight: 1.75, margin: '0 0 28px', maxWidth: 480 }}>
              I'm Alun — founder of Altogether Agile, agile practitioner, trainer, coach, and Visiting Lecturer, University of Westminster. This page is about where I've come from, what I believe, and why I built this.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['London-based', '25+ years experience', '1,500+ trained', 'ABC Assessor'].map((tag, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.1)', color: p.lightTeal, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>{tag}</span>
              ))}
            </div>
          </div>
          {/* Photo of Alun — swap src when real photo is ready */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="/images/alun.jpg"
              alt="Alun Davies-Baker, founder of Altogether Agile"
              style={{ width: isMobile ? '70%' : '65%', height: 'auto', display: 'block', borderRadius: 16 }}
              onError={(e) => {
                // Fallback to styled placeholder if image not found
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.style.background = '#1A9090';
                  parent.style.display = 'flex';
                  parent.style.flexDirection = 'column';
                  parent.style.alignItems = 'center';
                  parent.style.justifyContent = 'center';
                  parent.style.gap = '10px';
                  parent.style.position = 'relative';
                  parent.innerHTML = `
                    <div style="position:absolute;bottom:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.07)"></div>
                    <div style="position:absolute;top:-30px;left:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.05)"></div>
                    <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center">
                      <svg width="36" height="36" viewBox="0 0 256 256" fill="rgba(255,255,255,0.7)"><path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220ZM128,144a56,56,0,1,0-56-56A56.06,56.06,0,0,0,128,144Zm0,16c-30.67,0-58.7,12.36-79.49,34H207.49C186.7,172.36,158.67,160,128,160Z"/></svg>
                    </div>
                    <div style="color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Photo of Alun</div>
                  `;
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── PERSONAL STORY ─── */}
      <div className="aa-section-pad" style={{ background: p.white }}>
        <div className="aa-two-col-wide">
          <div>
            <SectionHeading label="The story" title="How I got here." />
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: '0 0 18px' }}>
              I didn't set out to be an agile trainer. I started as a graduate trainee at SSA after a Masters at UMIST, writing code for ERP systems on AS400. What followed was fifteen years at Boehringer Ingelheim — moving from systems analyst to Head of IS Consulting to leading a global SAP deployment across six countries.
            </p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: '0 0 18px' }}>
              It was inside Boehringer that I first got serious about agile — pioneering a Scrum-wrapped-with-DSDM approach to enterprise SAP rollouts at a time when most organisations considered the two incompatible. It worked. Not perfectly, but well enough to prove the point.
            </p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: '0 0 18px' }}>
              In 2016 I went independent, founding Altogether Agile and building a training and coaching practice from the ground up. I've worked as an affiliate trainer with QA, Metadata Training, and TCC; as a Scrum Master and Assessor at the Agile Business Consortium; and as a Visiting Lecturer at the University of Westminster since 2020.
            </p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.85, margin: 0 }}>
              Altogether Agile is now the centre of gravity — training, coaching, knowledge base, and platform in one place. One person, nearly 30 years of experience, and a genuine belief that agile works when it's taught and coached by someone who's actually done it.
            </p>
          </div>

          {/* credentials sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: p.skyTeal, borderRadius: 14, padding: 24 }}>
              <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.GraduationCap />Credentials
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {credentials.map((cred, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: p.body, fontSize: 13, lineHeight: 1.5 }}>
                    <span style={{ color: p.orange, flexShrink: 0, marginTop: 1 }}><Icons.CheckCircle /></span>{cred}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: p.deepTeal, borderRadius: 14, padding: 24 }}>
              <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Work with me</div>
              <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.65, margin: '0 0 16px' }}>Not sure where to start? A chemistry session is a free 30-minute conversation — no agenda, no commitment.</p>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: p.orange, color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', textDecoration: 'none', boxSizing: 'border-box', justifyContent: 'center' }}
              >
                <Icons.Chat />Book a chemistry session
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <SectionHeading label="Feedback" title="What people say." />
        <div className="aa-feedback-row">
          <AboutSidebarQuotes />
        </div>
      </div>

      {/* ─── MISSION ─── */}
      <div className="aa-section-pad" style={{ background: '#006666' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <SectionHeading label="Why Altogether Agile exists" title="The mission." light />
          <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.85, margin: '0 0 20px' }}>
            Most agile training is too abstract. It describes frameworks without connecting them to real problems. It teaches ceremonies without explaining why they exist. It certifies people who leave the course without knowing what to do on Monday morning.
          </p>
          <p style={{ color: '#fff', fontSize: 16, lineHeight: 1.85, margin: '0 0 20px', fontWeight: 500 }}>
            Altogether Agile exists to close that gap. That means every technique connects to a real decision, not a hypothetical one — and every session ends with something concrete enough to act on.
          </p>
          <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.85, margin: 0 }}>
            Every course, every coaching conversation, and every technique in the knowledge base is designed to be immediately usable — not a concept to be filed away for later. That means real scenarios, honest facilitation, and a trainer who's been in the room for real.
          </p>
        </div>
      </div>

      {/* ─── PHILOSOPHY ─── */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <SectionHeading label="How I work" title="Training and coaching philosophy." />
        <div className="aa-two-col" style={{ gap: 24 }}>
          {philosophyCards.map((card, i) => (
            <div key={i} style={{ background: p.white, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: card.lightBg, padding: '20px 28px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: card.colour, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{card.label}</div>
                <div style={{ color: p.deepTeal, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{card.heading}</div>
              </div>
              <div style={{ padding: '24px 28px 28px' }}>
                <p style={{ color: p.body, fontSize: 14, lineHeight: 1.8, margin: '0 0 20px' }}>{card.body}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {card.principles.map((principle, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: p.body, fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ color: card.colour, flexShrink: 0, marginTop: 1 }}><Icons.CheckCircle /></span>{principle}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TIMELINE ─── */}
      <div className="aa-section-pad" style={{ background: p.white }}>
        <SectionHeading label="Career" title="How it unfolded." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 680 }}>
          {timeline.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 24, position: 'relative' }}>
              {i < timeline.length - 1 && (
                <div style={{ position: 'absolute', left: 19, top: 40, bottom: -8, width: 2, background: p.paleTeal }} />
              )}
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: i === timeline.length - 1 ? p.orange : p.deepTeal, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, fontSize: 10, fontWeight: 700 }}>
                {i === timeline.length - 1 ? 'Now' : ''}
                {i !== timeline.length - 1 && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
                )}
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

      {/* ─── CTA ─── */}
      <div style={{ background: p.deepTeal, padding: isMobile ? '40px 20px' : '56px 48px' }}>
        <div className="aa-two-col" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Work with Altogether Agile</div>
            <h2 style={{ color: '#fff', fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>Ready to work with someone who's been in the room?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.75, margin: '0 0 24px' }}>Browse upcoming courses, explore the knowledge base, or book a free chemistry session to talk through what you need.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: p.orange, color: '#fff', border: 'none', padding: '13px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              >
                <Icons.Chat />Book a chemistry session
              </a>
              <Link to="/events" style={{ color: p.lightTeal, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                Browse Events <Icons.ArrowRight />
              </Link>
              <Link to="/knowledge" style={{ color: p.lightTeal, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
                Knowledge Base <Icons.ArrowRight />
              </Link>
            </div>
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

export default About;
