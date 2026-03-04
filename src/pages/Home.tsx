import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, EventData } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';

// ─── Mobile detection hook ──────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ─── Responsive CSS classes (media-query driven) ────────────────────────────
const ResponsiveStyles = () => (
  <style>{`
    .aa-nav-links { display: flex; }
    .aa-hero-grid { display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: center; }
    .aa-two-col-wide { display: grid; grid-template-columns: 380px 1fr; gap: 64px; align-items: center; }
    .aa-two-col-right { display: grid; grid-template-columns: 1fr 300px; gap: 48px; align-items: center; }
    .aa-two-col-left { display: grid; grid-template-columns: 280px 1fr; gap: 48px; align-items: start; }
    .aa-two-col-cta { display: grid; grid-template-columns: 1fr 260px; gap: 48px; align-items: center; }
    .aa-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .aa-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
    .aa-stats-bar { display: flex; align-items: stretch; justify-content: center; }
    .aa-section-pad { padding: 64px 48px; }
    .aa-hero-h1 { font-size: 50px; }
    .aa-hide-mobile { display: block; }
    .aa-hamburger { display: none; }

    @media (max-width: 767px) {
      .aa-hamburger { display: block !important; }
      .aa-nav-links { display: none; }
      .aa-hero-grid { grid-template-columns: 1fr; }
      .aa-two-col-wide { grid-template-columns: 1fr; }
      .aa-two-col-right { grid-template-columns: 1fr; }
      .aa-two-col-left { grid-template-columns: 1fr; }
      .aa-two-col-cta { grid-template-columns: 1fr; }
      .aa-three-col { grid-template-columns: 1fr; }
      .aa-footer-grid { grid-template-columns: 1fr; gap: 32px; }
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
};

// ─── Two-colour wordmark ────────────────────────────────────────────────────
const LogoFull = ({ height = 48, light = false }: { height?: number; light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
    <span style={{
      color: light ? '#fff' : '#004D4D',
      fontWeight: 800,
      fontSize: height * 0.48,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>Altogether</span>
    <span style={{
      color: '#FF9715',
      fontWeight: 800,
      fontSize: height * 0.48,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>Agile</span>
  </div>
);

// ─── Illustration placeholders (styled divs, correct dimensions) ────────────
const TeamIllustration = ({ height = 180, bg = '#D9F2F2', count = 3, label }: {
  height?: number; bg?: string; count?: number; label?: string;
}) => {
  const heights = [100, 120, 108, 95, 115];
  const colors = ['#004D4D', '#007A7A', '#FF9715', '#006060', '#338080'];
  const skinTones = ['#FDDBB4', '#D4956A', '#8D5524', '#FDDBB4', '#C68642'];
  return (
    <div style={{ height, background: bg, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px 16px', position: 'relative', overflow: 'hidden' }}>
      {label && (
        <div style={{ position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center', color: '#007A7A', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Illustration &middot; {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => {
          const h = heights[i % heights.length];
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: skinTones[i % skinTones.length], marginBottom: 2 }} />
              <div style={{ width: 36, height: h * 0.6, background: colors[i % colors.length], borderRadius: '8px 8px 0 0', opacity: 0.85 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const IllustrationSpot = ({ height = 180, label, bg = '#D9F2F2', style = {} }: {
  height?: number; label?: string; bg?: string; style?: React.CSSProperties;
}) => (
  <div style={{ height, background: bg, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, ...style }}>
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="16" r="8" fill="#007A7A" opacity="0.5" />
      <ellipse cx="24" cy="36" rx="14" ry="8" fill="#007A7A" opacity="0.35" />
      <circle cx="24" cy="16" r="5" fill="#004D4D" opacity="0.4" />
    </svg>
    <div style={{ color: '#007A7A', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', padding: '0 16px' }}>{label}</div>
  </div>
);

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return 'Free';
  const symbol = currency?.toLowerCase() === 'gbp' ? '\u00a3' : currency?.toLowerCase() === 'eur' ? '\u20ac' : '$';
  return `${symbol}${(cents / 100).toLocaleString()}`;
}

function formatDateRange(start: string, end: string | null): string {
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (!end || start === end) return s.toLocaleDateString('en-GB', opts);
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}\u2013${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${s.toLocaleDateString('en-GB', opts)} \u2013 ${e.toLocaleDateString('en-GB', opts)}`;
}

function getDuration(event: EventData): string {
  const days = event.event_template?.duration_days;
  if (days) return `${days} day${days !== 1 ? 's' : ''}`;
  if (event.start_date && event.end_date) {
    const diff = Math.ceil((new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} day${diff !== 1 ? 's' : ''}`;
  }
  return '1 day';
}

function getEventType(event: EventData): string {
  return event.event_type?.name || event.event_template?.event_types?.name || 'Event';
}

const typeColorMap: Record<string, string> = {
  Course: '#004D4D',
  Workshop: '#007A7A',
  Masterclass: '#FF9715',
};

function getTypeColor(name: string): string {
  return typeColorMap[name] || '#007A7A';
}

// ─── Main Component ─────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Events', to: '/events' },
  { label: 'Knowledge Base', to: '/knowledge' },
  { label: 'Coaching', to: '/coaching' },
  { label: 'About', to: '/testimonials' },
  { label: 'Contact', to: '/contact' },
];

const Home: React.FC = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: allEvents } = useEvents();
  const { user } = useAuth();

  const events = (allEvents || [])
    .filter((e) => new Date(e.start_date) >= new Date())
    .slice(0, 3);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#FFFFFF' }}>
      <ResponsiveStyles />

      {/* ─── NAV ─── */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #D9F2F2', padding: isMobile ? '0 20px' : '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/">
          <LogoFull height={38} />
        </Link>
        <div className="aa-nav-links" style={{ gap: 32 }}>
          {NAV_LINKS.map((item) => (
            <Link key={item.label} to={item.to} style={{ color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <Link to="/dashboard" style={{ background: '#FF9715', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>
              Dashboard
            </Link>
          ) : (
            <Link to="/auth" style={{ background: '#FF9715', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
          <button
            className="aa-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            style={{ background: 'none', border: 'none', color: '#004D4D', fontSize: 24, cursor: 'pointer', padding: 4, lineHeight: 1 }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </nav>

      {/* ─── MOBILE DROPDOWN ─── */}
      {menuOpen && (
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #D9F2F2', position: 'sticky', top: 64, zIndex: 99 }}>
          {NAV_LINKS.map((item, i) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '14px 20px',
                color: '#374151',
                fontSize: 15,
                fontWeight: 500,
                textDecoration: 'none',
                borderBottom: i < NAV_LINKS.length - 1 ? '1px solid #D9F2F2' : 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* ─── HERO ─── */}
      <div className="aa-section-pad" style={{ background: '#F0FAFA' }}>
        <div className="aa-hero-grid">
          <div>
            <h1 className="aa-hero-h1" style={{ color: '#004D4D', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px' }}>
              Agile training that<br />actually changes<br />how you work.
            </h1>
            <p style={{ color: '#374151', fontSize: 16, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 480 }}>
              Altogether Agile is built on 25 years of hands-on agile experience — delivering certified courses, practical coaching, and a library of 80+ techniques for teams who want real results, not just a certificate.
            </p>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <Link to="/events" style={{ background: '#FF9715', color: '#fff', border: 'none', padding: '13px 26px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                Browse Events <Icons.ArrowRight />
              </Link>
              <Link to="/knowledge" style={{ color: '#004D4D', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                Knowledge Base <Icons.ArrowRight />
              </Link>
            </div>
          </div>
          <div className="aa-hide-mobile" style={{ position: 'relative' }}>
            <TeamIllustration height={280} bg="#D9F2F2" count={4} label="Diverse team" />
            <div style={{ position: 'absolute', bottom: -12, right: -12, background: '#FF9715', color: '#fff', borderRadius: 12, padding: '10px 16px', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 16px rgba(255,151,21,0.35)' }}>
              1,500+ practitioners trained
            </div>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR ─── */}
      <div className="aa-stats-bar" style={{ background: '#FFFFFF', padding: '20px 48px', borderBottom: '1px solid #D9F2F2' }}>
        {[
          { icon: <Icons.Users />, num: '1,500+', label: 'Practitioners trained' },
          { icon: <Icons.Books />, num: '80+', label: 'Agile techniques' },
          { icon: <Icons.GraduationCap />, num: '12+', label: 'Certifications offered' },
          { icon: <Icons.Star />, num: '4.9\u2605', label: 'Average rating' },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 40px', borderRight: i < 3 ? '1px solid #D9F2F2' : 'none' }}>
            <div style={{ color: '#FF9715', display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ color: '#004D4D', fontSize: 22, fontWeight: 800 }}>{stat.num}</div>
            <div style={{ color: '#6B7280', fontSize: 12 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ─── WHO IS THIS FOR ─── */}
      <div className="aa-section-pad" style={{ background: '#FFFFFF', paddingTop: 56, paddingBottom: 48 }}>
        <h2 style={{ color: '#004D4D', fontSize: 28, fontWeight: 800, margin: '0 0 32px', textAlign: 'center' }}>Who is this for?</h2>
        <div className="aa-three-col">
          {[
            { icon: <Icons.ArrowRight />, heading: 'Moving into agile', body: "You're a project manager, BA, or team lead transitioning to agile ways of working and need grounded, practical guidance - not just theory." },
            { icon: <Icons.GraduationCap />, heading: 'Seeking certification', body: "You want a recognised credential - Scrum Master, AgileBA, AgilePM, or ICAgile - delivered by someone who's examined and authored the syllabuses." },
            { icon: <Icons.Users />, heading: 'Building team agility', body: "You're a leader trying to grow genuine organisational agility - and you need a coach who understands both the human and structural side of change." },
          ].map((card, i) => (
            <div key={i} style={{ background: '#F0FAFA', borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#004D4D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {card.icon}
              </div>
              <div style={{ color: '#004D4D', fontSize: 17, fontWeight: 700 }}>{card.heading}</div>
              <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.65 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── EVENTS (live Supabase data) ─── */}
      <div className="aa-section-pad" style={{ background: '#F0FAFA' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <h2 style={{ color: '#004D4D', fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>Upcoming Events</h2>
            <p style={{ color: '#6B7280', fontSize: 15, margin: 0 }}>Certified courses, workshops and masterclasses</p>
          </div>
          <Link to="/events" style={{ color: '#FF9715', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
            View all <Icons.ArrowRight />
          </Link>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No upcoming events scheduled</p>
            <p style={{ fontSize: 14 }}>Check back soon for new courses and workshops.</p>
          </div>
        ) : (
          <div className="aa-three-col">
            {events.map((event) => {
              const typeName = getEventType(event);
              return (
                <Link key={event.id} to={`/events/${event.id}`} style={{ background: '#FFFFFF', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: getTypeColor(typeName), color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{typeName}</span>
                    <span style={{ color: '#007A7A', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icons.Clock />{getDuration(event)}
                    </span>
                  </div>
                  <div style={{ color: '#004D4D', fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{event.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ color: '#374151', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: '#007A7A', flexShrink: 0 }}><Icons.Calendar /></span>
                      {formatDateRange(event.start_date, event.end_date)}
                    </div>
                    {event.location && (
                      <div style={{ color: '#374151', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ color: '#007A7A', flexShrink: 0 }}><Icons.MapPin /></span>
                        {event.location.name}
                      </div>
                    )}
                    {event.instructor && (
                      <div style={{ color: '#374151', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ color: '#007A7A', flexShrink: 0 }}><Icons.User /></span>
                        {event.instructor.name}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#004D4D', fontWeight: 800, fontSize: 18 }}>
                      {formatPrice(event.price_cents, event.currency)}
                    </span>
                    <span style={{ background: '#FF9715', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      Register <Icons.ArrowRight />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ABOUT ALUN ─── */}
      <div className="aa-section-pad" style={{ background: '#FFFFFF' }}>
        <div className="aa-two-col-wide">
          <div style={{ position: 'relative' }}>
            <TeamIllustration height={320} bg="#D9F2F2" count={1} label="Alun - founder photo" />
            <div style={{ position: 'absolute', bottom: -16, left: -16, background: '#004D4D', color: '#fff', borderRadius: 12, padding: '12px 18px' }}>
              <div style={{ fontSize: 11, color: '#B2DFDF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Credentials</div>
              {['ABC Level-4 Specialist', 'Advanced Certified Scrum Master', 'ABC Assessor', 'University of Westminster Lecturer'].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#fff', marginBottom: 4 }}>
                  <span style={{ color: '#FF9715' }}><Icons.CheckCircle /></span>{c}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FAFA', color: '#007A7A', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, marginBottom: 20 }}>
              <Icons.User />About Alun
            </div>
            <h2 style={{ color: '#004D4D', fontSize: 32, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
              Train with someone<br />who's been in the room.
            </h2>
            <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.75, margin: '0 0 16px' }}>
              I'm Alun, founder of Altogether Agile. I've spent 25 years working in and around agile teams — as a practitioner, a coach, and a trainer. I've authored AgileBA modules for the Agile Business Consortium, assessed professional membership candidates as an ABC Assessor, and lectured at the University of Westminster.
            </p>
            <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.75, margin: '0 0 28px' }}>
              I started Altogether Agile because I believe good agile training should be grounded in real experience — not slides recycled from a manual. I've trained over 1,500 people across organisations of every size, and I still run every course myself.
            </p>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <Link to="/contact" style={{ background: '#FF9715', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                Book a chemistry session <Icons.ArrowRight />
              </Link>
              <Link to="/testimonials" style={{ color: '#004D4D', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                Read more <Icons.ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── KNOWLEDGE BASE ─── */}
      <div className="aa-section-pad" style={{ background: '#004D4D' }}>
        <div className="aa-two-col-right">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', color: '#B2DFDF', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20, marginBottom: 20 }}>
              <Icons.Books />Knowledge Base
            </div>
            <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>80+ agile techniques,<br />ready to use</h2>
            <p style={{ color: '#B2DFDF', fontSize: 16, margin: '0 0 24px', lineHeight: 1.6 }}>
              From Story Mapping to OKRs — every technique explained with purpose, usage, origins, and real examples. Searchable, filterable, and built for practitioners.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {['Story Mapping', 'OKRs', '5 Whys', 'Business Model Canvas', 'Impact Mapping', 'Retrospectives'].map((tag) => (
                <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.08)', color: '#B2DFDF', fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20 }}>
                  <Icons.Tag />{tag}
                </span>
              ))}
            </div>
            <Link to="/knowledge" style={{ background: '#FF9715', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              Browse Techniques <Icons.ArrowRight />
            </Link>
          </div>
          <IllustrationSpot height={260} label="Person at knowledge base / library" bg="rgba(255,255,255,0.06)" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      {/* ─── TESTIMONIALS ─── */}
      <div className="aa-section-pad" style={{ background: '#FFFFFF' }}>
        <div className="aa-two-col-left">
          <div>
            <h2 style={{ color: '#004D4D', fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>What our attendees say</h2>
            <p style={{ color: '#6B7280', fontSize: 15, margin: '0 0 24px' }}>Real feedback from real practitioners</p>
            <TeamIllustration height={180} bg="#F0FAFA" count={3} label="Team group" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { quote: 'The Scrum Master course gave me the confidence to lead my first sprint. Practical, well-paced, and genuinely useful.', name: 'Sarah Mitchell', role: 'Delivery Lead \u00b7 NHS', course: 'Scrum Master' },
              { quote: 'I completed both the Agile Foundation and Practitioner courses. Excellent tutor with extensive knowledge and an adaptable approach.', name: 'James Thornton', role: 'Programme Manager \u00b7 HSBC', course: 'AgileBA' },
              { quote: 'Despite covering a lot of content including prep for 2 exams, I thoroughly enjoyed the training and found it very engaging.', name: 'Priya Sharma', role: 'Senior Programme Officer \u00b7 Public Health', course: 'AgilePM' },
            ].map((t, i) => (
              <div key={i} style={{ background: '#F0FAFA', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#D9F2F2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007A7A' }}>
                  <Icons.User />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#374151', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>&ldquo;{t.quote}&rdquo;</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#004D4D', fontWeight: 700, fontSize: 12 }}>{t.name}</div>
                      <div style={{ color: '#6B7280', fontSize: 11 }}>{t.role}</div>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#D9F2F2', color: '#007A7A', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                      <Icons.GraduationCap />{t.course}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div className="aa-section-pad" style={{ background: '#FF9715' }}>
        <div className="aa-two-col-cta">
          <div>
            <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
              Ready to work with someone<br />who's been in the room?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, margin: '0 0 28px', lineHeight: 1.6 }}>
              Browse upcoming courses or book a free chemistry session to talk through what you need. No hard sell — just a conversation.
            </p>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <Link to="/events" style={{ background: '#004D4D', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                Browse Events <Icons.ArrowRight />
              </Link>
              <Link to="/contact" style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <Icons.Chat />Book a chemistry session
              </Link>
            </div>
          </div>
          <TeamIllustration height={160} bg="rgba(255,255,255,0.15)" count={3} label="Celebration scene" />
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{ background: '#004D4D', padding: '48px 20px 32px' }}>
        <div className="aa-footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}>
              <LogoFull height={40} light />
            </div>
            <div style={{ color: '#B2DFDF', fontSize: 14, lineHeight: 1.75, maxWidth: 300 }}>
              Agile training, coaching and facilitation — grounded in 25 years of real experience. Based in London, working everywhere.
            </div>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Links</div>
            {[
              { label: 'Events', to: '/events' },
              { label: 'Knowledge Base', to: '/knowledge' },
              { label: 'Coaching', to: '/coaching' },
              { label: 'About', to: '/testimonials' },
              { label: 'Contact', to: '/contact' },
            ].map((link) => (
              <Link key={link.label} to={link.to} style={{ display: 'block', color: '#B2DFDF', fontSize: 13, marginBottom: 8, cursor: 'pointer', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get in Touch</div>
            <div style={{ color: '#B2DFDF', fontSize: 13, marginBottom: 8 }}>info@altogetheragile.com</div>
            <div style={{ color: '#B2DFDF', fontSize: 13 }}>London, England</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, color: '#B2DFDF', fontSize: 12, textAlign: 'center' }}>
          &copy; 2026 Altogether Agile. All rights reserved.
        </div>
      </div>

    </div>
  );
};

export default Home;
