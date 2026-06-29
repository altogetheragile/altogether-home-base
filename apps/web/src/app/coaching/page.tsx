import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-settings';
import { getHomeTestimonials } from '@/lib/home';
import { buildMetadata, JsonLd, breadcrumbJsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import { HomeTestimonials } from '../HomeTestimonials';
import { CoachingEnquiryForm } from './CoachingEnquiryForm';

export const dynamic = 'force-dynamic';

const p = { white: '#FFFFFF', skyTeal: '#F0FAFA', paleTeal: '#D9F2F2', lightTeal: '#B2DFDF', midTeal: '#007A7A', deepTeal: '#004D4D', orange: '#FF9715', body: '#374151', muted: '#6B7280' };
const BOOKING_URL = 'https://calendly.com/alundaviesbaker/30min';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Coaching - Altogether Agile',
    description: 'Professional one-to-one coaching and agile team coaching. ICF-aligned approach with 25 years of experience.',
    path: '/coaching',
  }),
  title: { absolute: 'Coaching - Altogether Agile' },
};

const ArrowRight = () => <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" /></svg>;
const Chat = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z" /></svg>;
const CheckCircle = () => <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" /></svg>;
const User = () => <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220ZM128,144a56,56,0,1,0-56-56A56.06,56.06,0,0,0,128,144Z" /></svg>;
const Users = () => <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z" /></svg>;
const Calendar = () => <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" /></svg>;

const Heading = ({ label, title, light = false }: { label: string; title: string; light?: boolean }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ color: light ? p.lightTeal : p.orange, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <h2 style={{ color: light ? '#fff' : p.deepTeal, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h2>
  </div>
);

const services = [
  { id: 'one-to-one', icon: <User />, label: 'One-to-One', title: 'Professional Coaching', colour: '#1A9090', lightBg: '#E6F5F5', tagline: 'Space to think. Clarity to act.', description: "One-to-one coaching for professionals navigating change - whether that's a new role, a difficult team dynamic, a career pivot, or the challenge of leading in an agile organisation without a map.", detail: "This isn't mentoring or consultancy. I won't tell you what to do. My role is to hold the right space and ask the questions that help you find your own answers - because those are the ones that actually stick.", includes: ['60-minute sessions via video call or in person (London)', 'Pre-session reflection prompts sent 48 hours before', 'Session notes and agreed actions within 24 hours', 'WhatsApp or email support between sessions', 'ICF-aligned approach throughout'], price: 'On request', packageNote: 'Pricing discussed during your free chemistry session', cta: 'Book a chemistry session', img: '/images/coaching-one-to-one.webp', imgAlt: 'One-to-one coaching session in comfortable chairs', imgScale: 118, imgPos: 'center 35%' },
  { id: 'team', icon: <Users />, label: 'Team', title: 'Agile Team Coaching', colour: '#6B5FCC', lightBg: '#EEECF9', tagline: "Better teams don't happen by accident.", description: 'Coaching for agile teams that are technically doing the ceremonies but not getting the results - or for newly formed teams that want to build good habits from the start.', detail: 'I work with the whole team, not just the Scrum Master or team lead. That means coaching the dynamics, not just the process - how the team makes decisions, how they handle conflict, and whether their retrospectives are actually changing anything.', includes: ['Initial team assessment and health check', 'Fortnightly team coaching sessions (90 minutes)', 'One-to-one sessions with team lead or Scrum Master', 'Retrospective facilitation and coaching', 'Management 3.0 practices woven throughout'], price: 'On request', packageNote: 'Engagement length discussed during your free chemistry session', cta: 'Enquire about team coaching', img: '/images/coaching-team.webp', imgAlt: 'Team coaching session at a desk with laptop', imgScale: 105, imgPos: 'center center' },
];

const credentials = [
  { label: 'ICF-accredited', desc: 'Coaching approach aligned to International Coaching Federation standards' },
  { label: 'STAR Manager Practitioner', desc: 'Assessed portfolio across all nine management competencies' },
  { label: '25+ years experience', desc: 'Working in and around agile teams as practitioner, trainer, and coach' },
  { label: 'ABC Assessor', desc: 'Interviews professional membership candidates for the Agile Business Consortium' },
  { label: 'Management 3.0', desc: 'Licensed Facilitator - energising people, teams, and organisations' },
  { label: 'University Lecturer', desc: 'Part-time visiting lecturer at the University of Westminster' },
];

function Illustration({ src, alt, height, scale = 105, position = 'center center' }: { src: string; alt: string; height: number; scale?: number; position?: string }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', height, position: 'relative' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" style={{ width: `${scale}%`, height: `${scale}%`, objectFit: 'cover', objectPosition: position, display: 'block' }} />
    </div>
  );
}

export default async function CoachingPage() {
  const [settings, testimonials] = await Promise.all([getSiteSettings(), getHomeTestimonials()]);
  const firstNameOnly = settings.show_testimonial_first_name_only ?? false;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Service', serviceType: 'Agile Coaching', name: 'Agile Coaching and One-to-One Coaching', description: 'Professional one-to-one coaching and agile team coaching using an ICF-aligned approach, drawing on 25 years of hands-on experience.', url: `${SITE_URL}/coaching`, provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL }, areaServed: ['London', 'United Kingdom'] }} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Coaching', path: '/coaching' }])} />

      <style>{`
        .aa-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
        .aa-service-layout { display: grid; grid-template-columns: 1fr 360px; gap: 56px; align-items: start; }
        .aa-creds-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .aa-section-pad { padding: 64px 48px; }
        .aa-coach-hero { padding: 72px 48px 60px; }
        .aa-coach-band { padding: 56px 48px; }
        @media (max-width: 767px) {
          .aa-two-col { grid-template-columns: 1fr; gap: 24px; }
          .aa-service-layout { grid-template-columns: 1fr; }
          .aa-creds-grid { grid-template-columns: 1fr 1fr; }
          .aa-section-pad { padding: 40px 20px; }
          .aa-coach-hero { padding: 48px 20px 40px; }
          .aa-coach-band { padding: 40px 20px; }
          .aa-service-flip { direction: ltr !important; }
        }
      `}</style>

      {/* HERO */}
      <div id="main-content" className="aa-coach-hero" style={{ background: '#006666' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Coaching</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(34px, 5vw, 50px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px' }}>Coaching that asks<br />the right questions.</h1>
          <p style={{ color: p.lightTeal, fontSize: 17, lineHeight: 1.75, margin: '0 0 32px', maxWidth: 540 }}>Whether you&apos;re navigating a difficult career moment or trying to build a team that actually functions well - coaching works best when it&apos;s grounded in real experience. That&apos;s what Altogether Agile brings.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: p.orange, color: p.deepTeal, padding: '13px 26px', borderRadius: 10, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><Chat />Book a free chemistry session</a>
            <a href="#enquiry" style={{ color: p.lightTeal, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>Jump to enquiry form <ArrowRight /></a>
          </div>
        </div>
      </div>

      {/* WHAT COACHING IS */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div className="aa-service-layout">
          <div>
            <Heading label="The approach" title="Coaching isn't advice-giving." />
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>Most people who come to coaching are not short of information. They know what they should probably do. What they need is space to think it through - without someone else&apos;s agenda in the room.</p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>My role as a coach is to hold that space and ask the questions that help you find your own answers. That might sound simple. In practice it requires real skill - and real discipline not to reach for the easy answer on your behalf.</p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: 0 }}>Where it&apos;s useful, I&apos;ll bring 25 years of agile and organisational experience into the room. But the work is yours. That&apos;s why it sticks.</p>
          </div>
          <Illustration src="/images/coaching-hero.webp" alt="Two people having a coaching conversation" height={320} position="center 40%" />
        </div>
      </div>

      {/* SERVICES */}
      {services.map((service, si) => (
        <div key={service.id} className="aa-section-pad" style={{ background: si % 2 === 0 ? p.white : p.skyTeal }}>
          <div className="aa-service-layout aa-service-flip" style={{ direction: si % 2 === 1 ? 'rtl' : 'ltr' }}>
            <div style={{ direction: 'ltr' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: service.lightBg, color: service.colour, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>{service.icon}{service.label} Coaching</div>
              <h2 style={{ color: p.deepTeal, fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>{service.title}</h2>
              <div style={{ color: service.colour, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>{service.tagline}</div>
              <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 14px' }}>{service.description}</p>
              <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 28px' }}>{service.detail}</p>
              <div style={{ background: service.lightBg, borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
                <div style={{ color: service.colour, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>What&apos;s included</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {service.includes.map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: p.body, fontSize: 14, lineHeight: 1.6 }}>
                      <span style={{ color: service.colour, flexShrink: 0, marginTop: 1 }}><CheckCircle /></span>{item}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: p.deepTeal, fontSize: 20, fontWeight: 800 }}>{service.price}</div>
                  <div style={{ color: p.muted, fontSize: 12, marginTop: 2 }}>{service.packageNote}</div>
                </div>
                <a href="#enquiry" style={{ background: p.orange, color: p.deepTeal, padding: '13px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><Chat />{service.cta}</a>
              </div>
            </div>
            <div style={{ direction: 'ltr' }}>
              <Illustration src={service.img} alt={service.imgAlt} height={360} scale={service.imgScale} position={service.imgPos} />
            </div>
          </div>
        </div>
      ))}

      {/* CREDENTIALS */}
      <div className="aa-section-pad" style={{ background: '#006666' }}>
        <Heading label="Why Altogether Agile" title="Coaching grounded in real experience." light />
        <div className="aa-creds-grid">
          {credentials.map((cred) => (
            <div key={cred.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 20px 24px' }}>
              <div style={{ color: p.orange, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{cred.label}</div>
              <div style={{ color: p.lightTeal, fontSize: 13, lineHeight: 1.65 }}>{cred.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <HomeTestimonials items={testimonials} firstNameOnly={firstNameOnly} />

      {/* CHEMISTRY SESSION */}
      <div className="aa-coach-band" style={{ background: p.deepTeal }}>
        <div className="aa-two-col" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Free chemistry session</div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>Not sure if coaching is right for you?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.75, margin: '0 0 24px' }}>A chemistry session is a free 30-minute conversation - no agenda, no commitment. It&apos;s a chance for both of us to work out whether we&apos;re a good fit before anything else.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['30 minutes', 'No commitment', 'Video or phone', 'Free'].map((tag) => (
                <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', color: p.lightTeal, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '32px 28px' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Book your chemistry session</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ background: p.orange, color: p.deepTeal, padding: '14px 20px', borderRadius: 10, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}><Calendar />Book a time slot</a>
              <div style={{ color: p.lightTeal, fontSize: 12, textAlign: 'center' }}>Or use the enquiry form below</div>
            </div>
          </div>
        </div>
      </div>

      {/* ENQUIRY FORM */}
      <div id="enquiry" className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Heading label="Get in touch" title="Send an enquiry." />
          <CoachingEnquiryForm />
        </div>
      </div>
    </div>
  );
}
