import { Link } from "react-router-dom";
import { BOOKING_URL } from '@/config/featureFlags';
import { colors as p } from '@/theme/colors';

const credentials = [
  { label: "Lead Author, AgilePM3", icon: "✦" },
  { label: "ABC Level-4 Specialist", icon: "✦" },
  { label: "Advanced Certified Scrum Master", icon: "✦" },
  { label: "ABC Assessor", icon: "✦" },
  { label: "AgileBA Module Author", icon: "✦" },
  { label: "University of Westminster Lecturer", icon: "✦" },
];

export default function AboutSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .aa-cred-item {
          opacity: 0;
          animation: fadeUp 0.5s ease forwards;
        }
        .aa-cred-item:nth-child(1) { animation-delay: 0.1s; }
        .aa-cred-item:nth-child(2) { animation-delay: 0.2s; }
        .aa-cred-item:nth-child(3) { animation-delay: 0.3s; }
        .aa-cred-item:nth-child(4) { animation-delay: 0.4s; }
        .aa-cred-item:nth-child(5) { animation-delay: 0.5s; }
        .aa-cred-item:nth-child(6) { animation-delay: 0.6s; }

        .aa-photo-wrap:hover .aa-photo-overlay {
          opacity: 1;
        }
        .aa-cta-primary:hover {
          background: #E6870E !important;
          transform: translateY(-1px);
        }
        .aa-cta-secondary:hover {
          color: #004D4D !important;
          gap: 10px !important;
        }
        .aa-about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }
        @media (max-width: 767px) {
          .aa-about-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
        }
      `}</style>

      <section style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: p.white,
        padding: "96px 0 80px",
        overflow: "hidden",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 48px",
        }} className="aa-about-grid">

          {/* LEFT - Photo + credentials stack */}
          <div style={{ position: "relative" }}>

            {/* Large decorative circle behind photo */}
            <div style={{
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: p.paleTeal,
              top: -40,
              left: -60,
              zIndex: 0,
            }} />

            {/* Photo */}
            <div className="aa-photo-wrap" style={{
              position: "relative",
              zIndex: 1,
              width: 320,
              height: 380,
              boxShadow: "0 24px 64px rgba(0,77,77,0.15)",
              cursor: "default",
            }}>
              <img
                src="/images/alun.jpg"
                alt="Alun Davies-Baker, founder of Altogether Agile"
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  display: "block",
                  borderRadius: 24,
                }}
              />
              <div className="aa-photo-overlay" style={{
                position: "absolute", inset: 0,
                borderRadius: 24,
                background: "linear-gradient(to top, rgba(0,77,77,0.5) 0%, transparent 60%)",
                opacity: 0,
                transition: "opacity 0.3s ease",
              }} />
            </div>

            {/* Credentials card */}
            <div style={{
              marginTop: 28,
              background: p.deepTeal,
              borderRadius: 20,
              padding: "28px 32px",
              position: "relative",
              zIndex: 1,
            }}>
              {/* Years badge */}
              <div style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "#FF9715",
                borderRadius: 12,
                padding: "10px 14px",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(255,151,21,0.3)",
                minWidth: 72,
              }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", color: "#FFFFFF", fontSize: 26, fontWeight: 400, lineHeight: 1 }}>25</div>
                <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>years<br/>experience</div>
              </div>
              <div style={{
                color: p.orange,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <div style={{ width: 24, height: 2, background: p.orange }} />
                Credentials
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {credentials.map((c, i) => (
                  <div key={i} className="aa-cred-item" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                    <span style={{ color: p.orange, fontSize: 10, flexShrink: 0 }}>{c.icon}</span>
                    <span style={{ color: p.lightTeal, fontSize: 14, lineHeight: 1.4 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT - Text content */}
          <div style={{ paddingTop: 40 }}>

            <h2 style={{ color: p.deepTeal, fontSize: 28, fontWeight: 800, margin: '0 0 28px' }}>About Alun</h2>

            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              color: p.deepTeal,
              fontSize: 48,
              fontWeight: 400,
              lineHeight: 1.1,
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}>
              Train with someone
            </h2>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              color: p.deepTeal,
              fontSize: 48,
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.1,
              margin: "0 0 32px",
              letterSpacing: "-0.01em",
            }}>
              who's been in the room.
            </h2>

            {/* Decorative rule */}
            <div style={{ width: 48, height: 3, background: p.orange, borderRadius: 2, marginBottom: 32 }} />

            <p style={{
              color: p.body,
              fontSize: 17,
              lineHeight: 1.8,
              margin: "0 0 40px",
              maxWidth: 460,
            }}>
              I'm Alun, founder of Altogether Agile. I've spent 25 years in agile teams as a practitioner, coach and trainer - and I still run every course myself.
            </p>

            {/* Pull quote */}
            <div style={{
              borderLeft: `3px solid ${p.orange}`,
              paddingLeft: 20,
              marginBottom: 44,
            }}>
              <p style={{
                color: p.midTeal,
                fontSize: 15,
                lineHeight: 1.7,
                fontStyle: "italic",
                margin: 0,
              }}>
                "Good agile training should be grounded in real experience - not slides recycled from a manual."
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="aa-cta-primary" style={{
                background: p.orange,
                color: p.white,
                border: "none",
                padding: "14px 28px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
              }}>
                Book a Chemistry Session
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
                </svg>
              </a>

              <Link to="/about" className="aa-cta-secondary" style={{
                background: "none",
                border: "none",
                color: p.midTeal,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
                padding: 0,
                textDecoration: "none",
              }}>
                Read more
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
