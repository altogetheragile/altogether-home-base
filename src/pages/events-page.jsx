import { useState, useEffect } from "react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

const p = {
  white: "#FFFFFF",
  skyTeal: "#F0FAFA",
  deepTeal: "#004D4D",
  midTeal: "#007A7A",
  lightTeal: "#B2DFDF",
  paleTeal: "#D9F2F2",
  orange: "#FF9715",
  body: "#374151",
  muted: "#6B7280",
};

const ResponsiveStyles = () => (
  <style>{`
    .aa-nav-links { display: flex; }
    .aa-hamburger { display: none; }
    .aa-mobile-menu { display: none; }
    .aa-mobile-menu.open { display: flex; }
    .aa-events-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .aa-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
    .aa-section-pad { padding: 64px 48px; }
    .aa-filter-bar { display: flex; gap: 8px; flex-wrap: wrap; }
    .aa-page-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: end; }

    @media (max-width: 767px) {
      .aa-nav-links { display: none; }
      .aa-hamburger { display: flex; align-items: center; justify-content: center; }
      .aa-events-grid { grid-template-columns: 1fr; }
      .aa-footer-grid { grid-template-columns: 1fr; gap: 32px; }
      .aa-section-pad { padding: 32px 20px; }
      .aa-page-intro { grid-template-columns: 1fr; gap: 24px; }
    }
  `}</style>
);

const Icons = {
  Calendar: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,56a40,40,0,1,1-40,40A40,40,0,0,1,128,72Zm0,144a95.69,95.69,0,0,1-63.93-24.38C75.82,172.23,100.35,160,128,160s52.18,12.23,63.93,31.62A95.69,95.69,0,0,1,128,216Z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>
    </svg>
  ),
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
  Users: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"/>
    </svg>
  ),
};

const LogoFull = ({ height = 48, light = false }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
    <span style={{ color: light ? "#fff" : p.deepTeal, fontWeight: 800, fontSize: height * 0.48, letterSpacing: "0.04em", textTransform: "uppercase" }}>Altogether</span>
    <span style={{ color: p.orange, fontWeight: 800, fontSize: height * 0.48, letterSpacing: "0.04em", textTransform: "uppercase" }}>Agile</span>
  </div>
);

// Image placeholder for event cards
const EventImage = ({ type, index }) => {
  const bgs = {
    Course: "#5BA8A8",
    Workshop: "#7EC8C8",
    Masterclass: "#FFC266",
  };
  return (
    <div style={{
      height: 200,
      background: bgs[type] || bgs.Course,
      borderRadius: "12px 12px 0 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "flex-end",
      padding: "16px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* decorative rings */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.12)" }} />
      <div style={{ position: "absolute", top: -10, right: -10, width: 90, height: 90, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />
      <div style={{
        position: "absolute", top: 16, right: 16,
        color: "rgba(255,255,255,0.25)",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      }}>Illustration placeholder</div>
      {/* number badge */}
      <div style={{
        position: "absolute", top: 16, left: 20,
        width: 32, height: 32, borderRadius: "50%",
        background: "rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 13, fontWeight: 800,
      }}>{index + 1}</div>
    </div>
  );
};

const typeColors = {
  Course: p.deepTeal,
  Workshop: p.midTeal,
  Masterclass: p.orange,
};

const events = [
  { type: "Course", title: "Scrum Master Certification", date: "Apr 10–11, 2025", location: "London", mode: "In-person", price: "£900", duration: "2 days", spots: 12, desc: "Earn your Certified Scrum Master credential. Practical, examiner-led, and grounded in real delivery experience." },
  { type: "Course", title: "Product Owner Certification", date: "May 8–9, 2025", location: "London", mode: "In-person", price: "£900", duration: "2 days", spots: 10, desc: "Learn to own the backlog, set clear priorities, and align development with business value." },
  { type: "Masterclass", title: "Agile Leadership Masterclass", date: "Jun 5, 2025", location: "Online", mode: "Remote", price: "£450", duration: "1 day", spots: 20, desc: "For leaders and managers navigating the shift to agile — without losing control of what matters." },
  { type: "Course", title: "AgileBA Foundation", date: "Jun 18–19, 2025", location: "London", mode: "In-person", price: "£850", duration: "2 days", spots: 14, desc: "The Agile Business Consortium's foundation certificate for business analysts working in agile environments." },
  { type: "Workshop", title: "Agile Fundamentals Workshop", date: "Jul 3, 2025", location: "Online", mode: "Remote", price: "Free", duration: "Half day", spots: 30, desc: "A free introduction to agile thinking — ideal for teams new to iterative ways of working." },
  { type: "Course", title: "AgilePM Foundation & Practitioner", date: "Aug 12–14, 2025", location: "London", mode: "In-person", price: "£1,200", duration: "3 days", spots: 8, desc: "The full DSDM/AgilePM suite — foundation and practitioner combined into an intensive three-day programme." },
  { type: "Masterclass", title: "OKRs in Practice", date: "Sep 4, 2025", location: "Online", mode: "Remote", price: "£350", duration: "Half day", spots: 25, desc: "Cut through the hype. Learn how OKRs actually work as an intent-setting tool across planning horizons." },
  { type: "Workshop", title: "Story Mapping Workshop", date: "Sep 18, 2025", location: "London", mode: "In-person", price: "£300", duration: "1 day", spots: 16, desc: "A hands-on session using real product scenarios to build story maps that teams can actually deliver from." },
  { type: "Course", title: "ICAgile Agile Fundamentals", date: "Oct 7–8, 2025", location: "London", mode: "In-person", price: "£850", duration: "2 days", spots: 12, desc: "The ICAgile-accredited entry point for practitioners looking to build a formal agile credential." },
];

const filters = ["All", "Course", "Workshop", "Masterclass"];

export default function EventsPage() {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const navLinks = ["Events", "Knowledge Base", "Coaching", "About", "Contact"];

  const filtered = activeFilter === "All" ? events : events.filter(e => e.type === activeFilter);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <ResponsiveStyles />

      {/* NAV */}
      <div style={{ background: p.white, borderBottom: `1px solid ${p.paleTeal}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ padding: isMobile ? "0 20px" : "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <LogoFull height={38} />
          <div className="aa-nav-links" style={{ gap: 32 }}>
            {navLinks.map(item => (
              <span key={item} style={{ color: item === "Events" ? p.orange : p.body, fontWeight: item === "Events" ? 700 : 500, fontSize: 13, cursor: "pointer", borderBottom: item === "Events" ? `2px solid ${p.orange}` : "none", paddingBottom: 2 }}>{item}</span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ background: p.orange, color: "#fff", border: "none", padding: "9px 22px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Sign In</button>
            <button className="aa-hamburger" onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: p.deepTeal }}>
              {menuOpen
                ? <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>
                : <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>
              }
            </button>
          </div>
        </div>
        <div className={`aa-mobile-menu${menuOpen ? " open" : ""}`} style={{ flexDirection: "column", background: p.white, borderTop: `1px solid ${p.paleTeal}`, padding: "8px 0 16px" }}>
          {navLinks.map(item => (
            <span key={item} onClick={() => setMenuOpen(false)} style={{ color: item === "Events" ? p.orange : p.body, fontSize: 16, fontWeight: item === "Events" ? 700 : 500, padding: "14px 20px", cursor: "pointer", borderBottom: `1px solid ${p.paleTeal}` }}>{item}</span>
          ))}
        </div>
      </div>

      {/* PAGE INTRO — mid teal, lighter than homepage */}
      <div style={{ background: "#006666", padding: isMobile ? "40px 20px 0" : "64px 48px 0" }}>
        <div className="aa-page-intro" style={{ paddingBottom: isMobile ? 32 : 48, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Upcoming Events</div>
            <h1 style={{ color: "#fff", fontSize: isMobile ? 32 : 46, fontWeight: 800, lineHeight: 1.15, margin: "0 0 20px" }}>
              Practical. Certified.<br />Built for the real world.
            </h1>
            <p style={{ color: p.lightTeal, fontSize: 16, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              Every course and workshop is run personally by Alun — an ABC Assessor, AgileBA author, and practitioner with 25 years in the field. No guest trainers. No recycled slides.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-end" }}>
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, lineHeight: 1.6 }}>
                Not sure which course is right for you?
              </div>
              <button style={{ background: p.orange, color: "#fff", border: "none", padding: "11px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "fit-content" }}>
                <Icons.Chat />Book a free chemistry session
              </button>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {[{ n: "9", label: "Events this year" }, { n: "3", label: "Formats" }, { n: "1,500+", label: "Trained to date" }].map((s, i) => (
                <div key={i}>
                  <div style={{ color: p.orange, fontSize: 22, fontWeight: 800 }}>{s.n}</div>
                  <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILTER TABS — sit on the dark section so they feel attached */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, paddingTop: 0, overflowX: "auto" }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: "none",
                border: "none",
                padding: "16px 24px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                color: activeFilter === f ? p.orange : p.lightTeal,
                borderBottom: activeFilter === f ? `3px solid ${p.orange}` : "3px solid transparent",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
                letterSpacing: "0.02em",
              }}
            >{f}</button>
          ))}
          <div style={{ marginLeft: "auto", paddingRight: 4, color: p.lightTeal, fontSize: 12, whiteSpace: "nowrap" }}>
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </div>
        </div>
      </div>

      {/* EVENTS GRID */}
      <div className="aa-section-pad" style={{ background: p.skyTeal }}>
        <div className="aa-events-grid">
          {filtered.map((event, i) => (
            <div key={i} style={{ background: p.white, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 12px rgba(0,77,77,0.07)" }}>
              <EventImage type={event.type} index={i} />
              <div style={{ padding: "20px 20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {/* type + mode */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ background: typeColors[event.type], color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>{event.type}</span>
                  <span style={{ background: event.mode === "Remote" ? p.skyTeal : p.paleTeal, color: p.midTeal, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>{event.mode}</span>
                </div>

                {/* title */}
                <div style={{ color: p.deepTeal, fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{event.title}</div>

                {/* desc */}
                <div style={{ color: p.muted, fontSize: 13, lineHeight: 1.65, flex: 1 }}>{event.desc}</div>

                {/* meta */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, borderTop: `1px solid ${p.paleTeal}`, paddingTop: 12 }}>
                  {[
                    { icon: <Icons.Calendar />, text: event.date },
                    { icon: <Icons.MapPin />, text: event.location },
                    { icon: <Icons.Clock />, text: event.duration },
                    { icon: <Icons.Users />, text: `${event.spots} spots remaining` },
                  ].map((row, j) => (
                    <div key={j} style={{ color: p.body, fontSize: 12, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ color: p.midTeal, flexShrink: 0 }}>{row.icon}</span>{row.text}
                    </div>
                  ))}
                </div>

                {/* price + cta */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <div>
                    <div style={{ color: event.price === "Free" ? p.midTeal : p.deepTeal, fontSize: 20, fontWeight: 800 }}>{event.price}</div>
                    {event.price !== "Free" && <div style={{ color: p.muted, fontSize: 11 }}>per person + VAT</div>}
                  </div>
                  <button style={{ background: p.orange, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    {event.price === "Free" ? "Register" : "Enrol"} <Icons.ArrowRight />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: p.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>—</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No events in this category right now.</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Check back soon or book a chemistry session to discuss your needs.</div>
          </div>
        )}
      </div>

      {/* BESPOKE CTA */}
      <div style={{ background: "#006666", padding: isMobile ? "40px 20px" : "56px 48px" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 40, alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between" }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Bespoke Training</div>
            <h2 style={{ color: "#fff", fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: "0 0 12px", lineHeight: 1.2 }}>Need something tailored for your team?</h2>
            <p style={{ color: p.lightTeal, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              Altogether Agile delivers in-house courses and facilitated workshops for organisations of any size. Same quality, shaped around your context and challenges.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <button style={{ background: p.orange, color: "#fff", border: "none", padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
              <Icons.Chat />Book a conversation <Icons.ArrowRight />
            </button>
            <div style={{ color: p.lightTeal, fontSize: 12, textAlign: "center" }}>No hard sell. Just a conversation.</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: "#004D4D", padding: isMobile ? "40px 20px 24px" : "48px 48px 32px" }}>
        <div className="aa-footer-grid">
          <div>
            <div style={{ marginBottom: 16 }}><LogoFull height={38} light={true} /></div>
            <div style={{ color: p.lightTeal, fontSize: 14, lineHeight: 1.75, maxWidth: 300 }}>Agile training, coaching and facilitation — grounded in 25 years of real experience. Based in London, working everywhere.</div>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Links</div>
            {navLinks.map(link => <div key={link} style={{ color: p.lightTeal, fontSize: 13, marginBottom: 8, cursor: "pointer" }}>{link}</div>)}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 11, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>Get in Touch</div>
            <div style={{ color: p.lightTeal, fontSize: 13, marginBottom: 8 }}>info@altogetheragile.com</div>
            <div style={{ color: p.lightTeal, fontSize: 13 }}>London, England</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20, color: p.lightTeal, fontSize: 12, textAlign: "center" }}>
          © 2026 Altogether Agile. All rights reserved.
        </div>
      </div>

    </div>
  );
}
