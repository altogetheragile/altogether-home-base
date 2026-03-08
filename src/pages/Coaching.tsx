import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, BOOKING_URL } from '@/config/featureFlags';
import { supabase } from '@/integrations/supabase/client';
import { HomepageStrip } from '@/components/testimonials/TestimonialComponents';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';

// ─── Palette ────────────────────────────────────────────────────────────────
const p = {
  white: '#FFFFFF',
  skyTeal: '#F0FAFA',
  deepTeal: '#004D4D',
  midTeal: '#007A7A',
  lightTeal: '#B2DFDF',
  paleTeal: '#D9F2F2',
  orange: '#FF9715',
  body: '#374151',
  muted: '#6B7280',
};

// ─── Responsive CSS classes (media-query driven) ────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
    .aa-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .aa-service-layout { display: grid; grid-template-columns: 1fr 360px; gap: 56px; align-items: start; }
    .aa-creds-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .aa-section-pad { padding: 64px 48px; }

    @media (max-width: 767px) {
      .aa-two-col { grid-template-columns: 1fr; gap: 24px; }
      .aa-three-col { grid-template-columns: 1fr; }
      .aa-service-layout { grid-template-columns: 1fr; }
      .aa-creds-grid { grid-template-columns: 1fr 1fr; }
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
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
      <path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220ZM128,144a56,56,0,1,0-56-56A56.06,56.06,0,0,0,128,144Zm0,16c-30.67,0-58.7,12.36-79.49,34H207.49C186.7,172.36,158.67,160,128,160Z"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"/>
    </svg>
  ),
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M234.5,114.38l-45.1,39.36,13.51,58.6a16,16,0,0,1-23.84,17.34l-51.11-31-51,31a16,16,0,0,1-23.84-17.34l13.49-58.54L22.76,114.38a16,16,0,0,1,9.12-28.06l59.46-5.14,23.16-55.35a15.95,15.95,0,0,1,29.48,0L167.14,81.18l59.46,5.14a16,16,0,0,1,9.12,28.06Z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/>
    </svg>
  ),
};

// ─── Illustration placeholder ───────────────────────────────────────────────
const IllustrationSpot = ({ bg, height = 280 }: { bg: string; height?: number }) => (
  <div style={{ background: bg, borderRadius: 16, height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="24" height="24" viewBox="0 0 256 256" fill="rgba(255,255,255,0.7)">
        <path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220ZM128,144a56,56,0,1,0-56-56A56.06,56.06,0,0,0,128,144Zm0,16c-30.67,0-58.7,12.36-79.49,34H207.49C186.7,172.36,158.67,160,128,160Z"/>
      </svg>
    </div>
    {/* label hidden for production */}
  </div>
);

// ─── Section heading ────────────────────────────────────────────────────────
const SectionHeading = ({ label, title, light = false }: { label: string; title: string; light?: boolean }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ color: light ? p.lightTeal : p.orange, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <h2 style={{ color: light ? '#fff' : p.deepTeal, fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h2>
  </div>
);

// ─── Static data ────────────────────────────────────────────────────────────
const services = [
  {
    id: 'one-to-one',
    icon: <Icons.User />,
    label: 'One-to-One',
    title: 'Professional Coaching',
    colour: '#1A9090',
    lightBg: '#E6F5F5',
    tagline: 'Space to think. Clarity to act.',
    description: "One-to-one coaching for professionals navigating change — whether that's a new role, a difficult team dynamic, a career pivot, or the challenge of leading in an agile organisation without a map.",
    detail: "This isn't mentoring or consultancy. I won't tell you what to do. My role is to hold the right space and ask the questions that help you find your own answers — because those are the ones that actually stick.",
    includes: [
      '60-minute sessions via video call or in person (London)',
      'Pre-session reflection prompts sent 48 hours before',
      'Session notes and agreed actions within 24 hours',
      'WhatsApp or email support between sessions',
      'ICF-aligned approach throughout',
    ],
    price: 'On request',
    unit: '',
    packageNote: 'Pricing discussed during your free chemistry session',
    cta: 'Book a chemistry session',
  },
  {
    id: 'team',
    icon: <Icons.Users />,
    label: 'Team',
    title: 'Agile Team Coaching',
    colour: '#6B5FCC',
    lightBg: '#EEECF9',
    tagline: "Better teams don't happen by accident.",
    description: "Coaching for agile teams that are technically doing the ceremonies but not getting the results — or for newly formed teams that want to build good habits from the start.",
    detail: "I work with the whole team, not just the Scrum Master or team lead. That means coaching the dynamics, not just the process — how the team makes decisions, how they handle conflict, and whether their retrospectives are actually changing anything.",
    includes: [
      'Initial team assessment and health check',
      'Fortnightly team coaching sessions (90 minutes)',
      'One-to-one sessions with team lead or Scrum Master',
      'Retrospective facilitation and coaching',
      'Management 3.0 practices woven throughout',
    ],
    price: 'On request',
    unit: '',
    packageNote: 'Engagement length discussed during your free chemistry session',
    cta: 'Enquire about team coaching',
  },
];

const credentials = [
  { label: 'ICF-accredited', desc: 'Coaching approach aligned to International Coaching Federation standards' },
  { label: 'STAR Manager Practitioner', desc: 'Assessed portfolio across all nine management competencies' },
  { label: '25+ years experience', desc: 'Working in and around agile teams as practitioner, trainer, and coach' },
  { label: 'ABC Assessor', desc: 'Interviews professional membership candidates for the Agile Business Consortium' },
  { label: 'Management 3.0', desc: 'Licensed Facilitator — energising people, teams, and organisations' },
  { label: 'University Lecturer', desc: 'Part-time visiting lecturer at the University of Westminster' },
];

// ─── Component ──────────────────────────────────────────────────────────────
const Coaching: React.FC = () => {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({ name: '', email: '', service: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; message?: string } = {};

    if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const email = formData.email.trim();
    if (!email.includes('@') || !email.includes('.')) {
      errors.email = 'Please enter a valid email address.';
    }

    if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { error } = await supabase.from('contacts').insert({
        full_name: formData.name,
        email: formData.email,
        subject: `Coaching enquiry: ${formData.service || 'Not specified'}`,
        message: formData.message,
        enquiry_type: 'general',
        status: 'unread',
      });
      if (error) throw error;

      // Fire-and-forget email notification
      supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: `Coaching enquiry: ${formData.service || 'Not specified'}`,
          message: formData.message,
          enquiry_type: 'general',
        },
      }).catch(() => {});

      setSubmitted(true);
    } catch (err: any) {
      if (err.message?.includes('Rate limit')) {
        setSubmitError('Please wait a few minutes before submitting again.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToEnquiry = () => {
    document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <Helmet>
        <title>Coaching — Altogether Agile</title>
        <meta name="description" content="Professional one-to-one coaching and agile team coaching. ICF-aligned approach with 25 years of experience." />
        <link rel="canonical" href={`${SITE_URL}/coaching`} />
      </Helmet>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <Navigation />

      {/* ─── HERO ─── */}
      <div style={{ background: '#006666', padding: isMobile ? '48px 20px 40px' : '72px 48px 60px' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Coaching</div>
          <h1 style={{ color: '#fff', fontSize: isMobile ? 34 : 50, fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px' }}>
            Coaching that asks<br />the right questions.
          </h1>
          <p style={{ color: p.lightTeal, fontSize: 17, lineHeight: 1.75, margin: '0 0 32px', maxWidth: 540 }}>
            Whether you're navigating a difficult career moment or trying to build a team that actually functions well — coaching works best when it's grounded in real experience. That's what Altogether Agile brings.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: p.orange, color: '#fff', border: 'none', padding: '13px 26px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            >
              <Icons.Chat />Book a free chemistry session
            </a>
            <button
              type="button"
              onClick={scrollToEnquiry}
              style={{ background: 'none', border: 'none', padding: 0, color: p.lightTeal, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
            >
              Jump to enquiry form <Icons.ArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* ─── WHAT COACHING IS ─── */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div className="aa-service-layout">
          <div>
            <SectionHeading label="The approach" title="Coaching isn't advice-giving." />
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
              Most people who come to coaching are not short of information. They know what they should probably do. What they need is space to think it through — without someone else's agenda in the room.
            </p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
              My role as a coach is to hold that space and ask the questions that help you find your own answers. That might sound simple. In practice it requires real skill — and real discipline not to reach for the easy answer on your behalf.
            </p>
            <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
              Where it's useful, I'll bring 25 years of agile and organisational experience into the room. But the work is yours. That's why it sticks.
            </p>
          </div>
          <IllustrationSpot bg="#1A9090" height={320} />
        </div>
      </div>

      {/* ─── SERVICES ─── */}
      {services.map((service, si) => (
        <div key={service.id} className="aa-section-pad" style={{ background: si % 2 === 0 ? p.white : p.skyTeal }}>
          <div className="aa-service-layout" style={{ direction: si % 2 === 1 ? 'rtl' : 'ltr' }}>
            <div style={{ direction: 'ltr' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: service.lightBg, color: service.colour, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20, marginBottom: 20 }}>
                {service.icon}{service.label} Coaching
              </div>
              <h2 style={{ color: p.deepTeal, fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>{service.title}</h2>
              <div style={{ color: service.colour, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>{service.tagline}</div>
              <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 14px' }}>{service.description}</p>
              <p style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: '0 0 28px' }}>{service.detail}</p>

              {/* includes */}
              <div style={{ background: service.lightBg, borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
                <div style={{ color: service.colour, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>What's included</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {service.includes.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: p.body, fontSize: 14, lineHeight: 1.6 }}>
                      <span style={{ color: service.colour, flexShrink: 0, marginTop: 1 }}><Icons.CheckCircle /></span>{item}
                    </div>
                  ))}
                </div>
              </div>

              {/* price + cta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: p.deepTeal, fontSize: 20, fontWeight: 800 }}>{service.price}</div>
                  <div style={{ color: p.muted, fontSize: 12, marginTop: 2 }}>{service.packageNote}</div>
                </div>
                <button
                  onClick={scrollToEnquiry}
                  style={{ background: p.orange, color: '#fff', border: 'none', padding: '13px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Icons.Chat />{service.cta}
                </button>
              </div>
            </div>
            <div style={{ direction: 'ltr' }}>
              <IllustrationSpot bg={service.colour} height={360} />
            </div>
          </div>
        </div>
      ))}

      {/* ─── CREDENTIALS ─── */}
      <div className="aa-section-pad" style={{ background: '#006666' }}>
        <SectionHeading label="Why Altogether Agile" title="Coaching grounded in real experience." light />
        <div className="aa-creds-grid">
          {credentials.map((cred, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 20px 24px' }}>
              <div style={{ color: p.orange, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{cred.label}</div>
              <div style={{ color: p.lightTeal, fontSize: 13, lineHeight: 1.65 }}>{cred.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <HomepageStrip />

      {/* ─── CHEMISTRY SESSION ─── */}
      <div style={{ background: p.deepTeal, padding: isMobile ? '40px 20px' : '56px 48px' }}>
        <div className="aa-two-col" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Free chemistry session</div>
            <h2 style={{ color: '#fff', fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>Not sure if coaching is right for you?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.75, margin: '0 0 24px' }}>
              A chemistry session is a free 30-minute conversation — no agenda, no commitment. It's a chance for both of us to work out whether we're a good fit before anything else.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['30 minutes', 'No commitment', 'Video or phone', 'Free'].map((tag, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.1)', color: p.lightTeal, fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '32px 28px' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Book your chemistry session</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: p.orange, color: '#fff', border: 'none', padding: '14px 20px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              >
                <Icons.Calendar />Book a time slot
              </a>
              <div style={{ color: p.lightTeal, fontSize: 12, textAlign: 'center' }}>Or use the enquiry form below</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ENQUIRY FORM ─── */}
      <div id="enquiry" className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <SectionHeading label="Get in touch" title="Send an enquiry." />
          {submitted ? (
            <div style={{ background: p.white, borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E6F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#1A9090' }}>
                <Icons.CheckCircle />
              </div>
              <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Message sent</div>
              <div style={{ color: p.muted, fontSize: 14 }}>Thanks — I'll be in touch within one working day.</div>
            </div>
          ) : (
            <div style={{ background: p.white, borderRadius: 16, padding: isMobile ? '28px 20px' : '40px 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Your name', key: 'name' as const, type: 'text', placeholder: 'Jane Smith' },
                  { label: 'Email address', key: 'email' as const, type: 'email', placeholder: 'jane@company.com' },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ color: p.deepTeal, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.key]}
                      onChange={(e) => {
                        setFormData((d) => ({ ...d, [field.key]: e.target.value }));
                        if (validationErrors[field.key]) setValidationErrors((errs) => ({ ...errs, [field.key]: undefined }));
                      }}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${validationErrors[field.key] ? '#DC2626' : p.paleTeal}`, fontSize: 14, color: p.body, background: p.skyTeal, outline: 'none', boxSizing: 'border-box' }}
                    />
                    {validationErrors[field.key] && (
                      <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{validationErrors[field.key]}</div>
                    )}
                  </div>
                ))}
                <div>
                  <label style={{ color: p.deepTeal, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>I'm interested in</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData((d) => ({ ...d, service: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${p.paleTeal}`, fontSize: 14, color: formData.service ? p.body : p.muted, background: p.skyTeal, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">Select a service...</option>
                    <option value="one-to-one">One-to-One Professional Coaching</option>
                    <option value="team">Agile Team Coaching</option>
                    <option value="chemistry">Free Chemistry Session</option>
                    <option value="unsure">Not sure yet</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: p.deepTeal, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>What's on your mind?</label>
                  <textarea
                    placeholder="Tell me a bit about what you're working through or what you're looking for..."
                    value={formData.message}
                    onChange={(e) => {
                      setFormData((d) => ({ ...d, message: e.target.value }));
                      if (validationErrors.message) setValidationErrors((errs) => ({ ...errs, message: undefined }));
                    }}
                    rows={5}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${validationErrors.message ? '#DC2626' : p.paleTeal}`, fontSize: 14, color: p.body, background: p.skyTeal, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  {validationErrors.message && (
                    <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{validationErrors.message}</div>
                  )}
                </div>
                {submitError && (
                  <div style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{submitError}</div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ background: submitting ? p.muted : p.orange, color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: submitting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Sending...' : <>Send enquiry <Icons.ArrowRight /></>}
                </button>
                <div style={{ color: p.muted, fontSize: 12, textAlign: 'center' }}>I aim to respond within one working day. No hard sell — just a conversation.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
};

export default Coaching;
