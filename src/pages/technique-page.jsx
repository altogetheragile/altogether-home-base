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

const categoryColours = {
  Analysis:    { solid: "#1A9090", pill: "#0D5C5C", bg: "#E6F5F5" },
  Planning:    { solid: "#2BBABA", pill: "#1A7A7A", bg: "#E4F7F7" },
  Delivery:    { solid: "#F28C00", pill: "#8A4F00", bg: "#FFF3E0" },
  Facilitation:{ solid: "#2E9E6E", pill: "#1A5C40", bg: "#E6F5EE" },
  Strategy:    { solid: "#6B5FCC", pill: "#3D3580", bg: "#EEECF9" },
};

const ResponsiveStyles = () => (
  <style>{`
    .aa-nav-links { display: flex; }
    .aa-hamburger { display: none; }
    .aa-mobile-menu { display: none; }
    .aa-mobile-menu.open { display: flex; }
    .aa-technique-layout { display: grid; grid-template-columns: 1fr 300px; gap: 48px; align-items: start; }
    .aa-sticky-sidebar { position: sticky; top: 80px; }
    .aa-when-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .aa-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .aa-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }

    @media (max-width: 767px) {
      .aa-nav-links { display: none; }
      .aa-hamburger { display: flex; align-items: center; justify-content: center; }
      .aa-technique-layout { grid-template-columns: 1fr; }
      .aa-sticky-sidebar { position: static; }
      .aa-when-grid { grid-template-columns: 1fr; }
      .aa-related-grid { grid-template-columns: 1fr; }
      .aa-footer-grid { grid-template-columns: 1fr; gap: 32px; }
    }
  `}</style>
);

const Icons = {
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
    </svg>
  ),
  XCircle: () => (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M165.66,101.66l-37.66,37.67L90.34,101.66A8,8,0,0,0,79,112l37.67,37.66L79,187.32A8,8,0,0,0,90.34,198.64l37.66-37.67,37.66,37.67a8,8,0,0,0,11.32-11.32L139.31,149.66,177,112a8,8,0,0,0-11.32-11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
    </svg>
  ),
  GraduationCap: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V117.87l16-8.81V192a8,8,0,0,0,16,0V96A8,8,0,0,0,251.76,88.94ZM128,175.89,41.91,128.39,128,80.13l86.09,48.26ZM208,192H48V127l72,40h0a8,8,0,0,0,3.76,1h.48A8,8,0,0,0,128,167l72-40Z"/>
    </svg>
  ),
  Chat: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,48H40A16,16,0,0,0,24,64V224a15.85,15.85,0,0,0,9.24,14.5A16.13,16.13,0,0,0,40,240a15.89,15.89,0,0,0,10.25-3.78.69.69,0,0,0,.13-.11L82.5,208H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM216,192H82.5a16,16,0,0,0-10.25,3.78.69.69,0,0,0-.13.11L40,224V64H216Z"/>
    </svg>
  ),
  Books: () => (
    <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor">
      <path d="M231.65,194.53,198.28,39.06a16,16,0,0,0-19.21-12.19L132.78,37.31a16.08,16.08,0,0,0-12.19,19.22l4.33,20.29A16,16,0,0,0,112,72H48A16,16,0,0,0,32,88V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16v-1.56A15.92,15.92,0,0,0,231.65,194.53ZM168.27,41.14,204.93,213l-43.1,9.2L125.17,50.33ZM48,88h64v16H48Zm0,32h64v16H48Zm0,80V152h64v48Zm168,0H128V152h40a8,8,0,0,0,0-16H128V136h40a8,8,0,0,0,0-16H128V88h64Z"/>
    </svg>
  ),
};

const LogoFull = ({ height = 48, light = false }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
    <span style={{ color: light ? "#fff" : p.deepTeal, fontWeight: 800, fontSize: height * 0.48, letterSpacing: "0.04em", textTransform: "uppercase" }}>Altogether</span>
    <span style={{ color: p.orange, fontWeight: 800, fontSize: height * 0.48, letterSpacing: "0.04em", textTransform: "uppercase" }}>Agile</span>
  </div>
);

// --- Sample technique data ---
const technique = {
  title: "Story Mapping",
  category: "Analysis",
  horizons: ["Team", "Coordination"],
  frameworks: ["Scrum", "AgileBA", "ICAgile"],
  origins: "Jeff Patton, 2005",
  courses: ["AgileBA Foundation", "Scrum Master Certification", "ICAgile Agile Fundamentals"],
  summary: "Visualise the full user journey across a horizontal backbone of activities, with stories sliced vertically by priority — keeping the team focused on outcomes rather than a flat backlog.",

  what: [
    "A story map is a two-dimensional visualisation of user activity. The top row — the backbone — captures the major activities a user performs, in the sequence they actually do them. Beneath each activity, you hang the individual user stories that support it.",
    "The key insight is the vertical slicing. Rather than working through a flat backlog by priority, a story map lets you draw a horizontal line through the entire map to define a release or sprint — capturing the thinnest viable slice of the whole user experience.",
    "This keeps teams honest. A flat backlog can drift towards building the most technically interesting or easiest stories first. A story map forces the question: does this slice of work deliver a coherent, end-to-end experience for the user?",
  ],

  whenToUse: [
    "When starting a new product or feature and you need shared understanding across the team",
    "When a flat backlog has lost its narrative and the team can't see the wood for the trees",
    "When planning a release and you want to define the thinnest viable slice",
    "When onboarding new team members who need to understand what the product does",
  ],
  whenNotTo: [
    "When the scope is very small and a simple list will do — don't add ceremony for its own sake",
    "When the user journey is not yet understood — validate the problem first before mapping stories",
    "When working in a heavily regulated environment where requirements must be fixed upfront",
  ],

  steps: [
    { title: "Frame the goal", body: "Start with the outcome — what does the user need to achieve? Write it on a card at the top of the map." },
    { title: "Identify the backbone", body: "Walk through the user journey from left to right, naming the major activities. Keep it high-level — 5 to 10 activities is typical." },
    { title: "Hang the stories", body: "For each activity, add user stories below it. Don't worry about priority yet — get everything visible first." },
    { title: "Slice for releases", body: "Draw a horizontal line across the full map to define your first release — the thinnest slice that delivers a working, end-to-end experience." },
    { title: "Refine and iterate", body: "Keep the map visible throughout delivery. Update it as you learn. The map is a living artefact, not a one-off planning exercise." },
  ],

  example: {
    context: "Fielding & Finch, a mid-sized British homeware retailer, has identified that its Click & Collect service is failing. Customers are completing online orders but abandoning collection — or not returning at all.",
    scenario: "The product team runs a story mapping session. The backbone emerges quickly: Browse products → Add to basket → Pay → Receive confirmation → Visit store → Collect order. Beneath 'Visit store' the team surfaces twelve stories — and immediately spots the problem. There are no stories covering 'find the collection desk', 'receive a reminder before the collection window closes', or 'extend a collection slot'. These gaps explain the abandonment data.",
    outcome: "The team draws a release slice that cuts across the full journey but includes only the minimum viable experience: basic browse, pay, confirm, a reminder email, a clear in-store collection point, and a simple handover. Everything else moves below the line. The map becomes the artefact that aligns the product owner, developers, and store operations team for the first time.",
  },

  related: [
    { title: "Impact Mapping", category: "Analysis", summary: "Links delivery to business outcomes by mapping goals, actors, impacts, and stories." },
    { title: "MoSCoW Prioritisation", category: "Planning", summary: "Classifies requirements to drive release and sprint planning decisions." },
    { title: "Personas", category: "Analysis", summary: "Evidence-based user profiles that anchor story map backbones in real human needs." },
  ],
};

const SectionHeading = ({ label, title }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ color: p.orange, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <h2 style={{ color: p.deepTeal, fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{title}</h2>
  </div>
);

export default function TechniquePage() {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = ["Events", "Knowledge Base", "Coaching", "About", "Contact"];
  const col = categoryColours[technique.category] || categoryColours.Analysis;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: p.white }}>
      <ResponsiveStyles />

      {/* NAV */}
      <div style={{ background: p.white, borderBottom: `1px solid ${p.paleTeal}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ padding: isMobile ? "0 20px" : "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <LogoFull height={38} />
          <div className="aa-nav-links" style={{ gap: 32 }}>
            {navLinks.map(item => (
              <span key={item} style={{ color: item === "Knowledge Base" ? p.orange : p.body, fontWeight: item === "Knowledge Base" ? 700 : 500, fontSize: 13, cursor: "pointer", borderBottom: item === "Knowledge Base" ? `2px solid ${p.orange}` : "none", paddingBottom: 2 }}>{item}</span>
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
            <span key={item} onClick={() => setMenuOpen(false)} style={{ color: item === "Knowledge Base" ? p.orange : p.body, fontSize: 16, fontWeight: item === "Knowledge Base" ? 700 : 500, padding: "14px 20px", cursor: "pointer", borderBottom: `1px solid ${p.paleTeal}` }}>{item}</span>
          ))}
        </div>
      </div>

      {/* HERO BAND */}
      <div style={{ background: "#006666", padding: isMobile ? "40px 20px 36px" : "56px 48px 48px" }}>
        {/* breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: p.lightTeal, fontSize: 12 }}>
          <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Icons.ArrowLeft /> Knowledge Base</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ opacity: 0.7 }}>{technique.category}</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: "#fff" }}>{technique.title}</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          <span style={{ background: col.pill, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>{technique.category}</span>
          {technique.horizons.map(h => (
            <span key={h} style={{ background: "rgba(255,255,255,0.12)", color: p.lightTeal, fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>

        <h1 style={{ color: "#fff", fontSize: isMobile ? 32 : 48, fontWeight: 800, lineHeight: 1.1, margin: "0 0 16px" }}>{technique.title}</h1>
        <p style={{ color: p.lightTeal, fontSize: 17, lineHeight: 1.65, margin: 0, maxWidth: 620 }}>{technique.summary}</p>
      </div>

      {/* MAIN CONTENT + SIDEBAR */}
      <div style={{ padding: isMobile ? "32px 20px" : "56px 48px", background: p.skyTeal }}>
        <div className="aa-technique-layout">

          {/* LEFT - main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

            {/* WHAT IT IS */}
            <div>
              <SectionHeading label="Overview" title="What it is" />
              {technique.what.map((para, i) => (
                <p key={i} style={{ color: p.body, fontSize: 15, lineHeight: 1.8, margin: "0 0 16px" }}>{para}</p>
              ))}
            </div>

            {/* WHEN TO USE */}
            <div>
              <SectionHeading label="Application" title="When to use it — and when not to" />
              <div className="aa-when-grid">
                <div style={{ background: "#EAF5F5", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "20px 20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ color: "#5BA8A8" }}><Icons.CheckCircle /></span>
                    <span style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13 }}>Use it when</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {technique.whenToUse.map((item, i) => (
                      <div key={i} style={{ color: p.body, fontSize: 13, lineHeight: 1.6, paddingLeft: 20, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, top: 4, width: 6, height: 6, borderRadius: "50%", background: "#5BA8A8", display: "block" }} />
                        {item}
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
                <div style={{ background: "#FFF6E8", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "20px 20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ color: "#FFC266" }}><Icons.XCircle /></span>
                    <span style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13 }}>Don't use it when</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {technique.whenNotTo.map((item, i) => (
                      <div key={i} style={{ color: p.body, fontSize: 13, lineHeight: 1.6, paddingLeft: 20, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, top: 4, width: 6, height: 6, borderRadius: "50%", background: "#FFC266", display: "block" }} />
                        {item}
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* HOW TO RUN IT */}
            <div>
              <SectionHeading label="Instructions" title="How to run it" />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {technique.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 20, position: "relative" }}>
                    {/* connector line */}
                    {i < technique.steps.length - 1 && (
                      <div style={{ position: "absolute", left: 19, top: 40, bottom: -8, width: 2, background: p.paleTeal }} />
                    )}
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: p.deepTeal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0, zIndex: 1 }}>{i + 1}</div>
                    <div style={{ background: p.white, borderRadius: 12, padding: "16px 20px", marginBottom: 8, flex: 1 }}>
                      <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{step.title}</div>
                      <div style={{ color: p.body, fontSize: 13, lineHeight: 1.7 }}>{step.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DIAGRAM PLACEHOLDER */}
            <div>
              <SectionHeading label="Visual" title="Diagram" />
              <div style={{ background: p.paleTeal, borderRadius: 14, height: 340, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: p.lightTeal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 256 256" fill={p.midTeal}>
                    <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,200V172l52-52,44,44a16,16,0,0,0,22.63,0l20-20L216,181.38V200Z"/>
                  </svg>
                </div>
                <div style={{ color: p.midTeal, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Illustration placeholder</div>
                <div style={{ color: p.midTeal, fontSize: 12, opacity: 0.7 }}>Story map diagram showing backbone and story slices</div>
              </div>
            </div>

            {/* FIELDING & FINCH EXAMPLE */}
            <div>
              <SectionHeading label="Worked Example" title="Fielding &amp; Finch" />
              <div style={{ background: p.white, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ background: p.deepTeal, padding: "14px 24px", display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ background: p.orange, borderRadius: 6, padding: "3px 10px", color: "#fff", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Scenario</div>
                  <span style={{ color: p.lightTeal, fontSize: 12 }}>A mid-sized British homeware retailer with a failing Click &amp; Collect service</span>
                </div>
                <div style={{ padding: "24px" }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Context</div>
                    <p style={{ color: p.body, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{technique.example.context}</p>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>What happened</div>
                    <p style={{ color: p.body, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{technique.example.scenario}</p>
                  </div>
                  <div style={{ background: p.paleTeal, borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ color: p.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Outcome</div>
                    <p style={{ color: p.body, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{technique.example.outcome}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT - sticky sidebar */}
          <div className="aa-sticky-sidebar" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* At a glance */}
            <div style={{ background: p.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,77,77,0.07)" }}>
              <div style={{ background: col.bg, padding: "16px 20px", borderBottom: `1px solid ${p.paleTeal}` }}>
                <span style={{ background: col.pill, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>{technique.category}</span>
              </div>
              <div style={{ padding: "20px 20px 24px" }}>
                <div style={{ color: p.deepTeal, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>At a glance</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <div style={{ color: p.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Planning Horizons</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {technique.horizons.map(h => (
                        <span key={h} style={{ background: p.paleTeal, color: p.midTeal, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{h}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: p.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Frameworks</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {technique.frameworks.map(f => (
                        <span key={f} style={{ background: p.skyTeal, color: p.deepTeal, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: `1px solid ${p.paleTeal}` }}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: p.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Origins</div>
                    <div style={{ color: p.body, fontSize: 13 }}>{technique.origins}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Covered in these courses */}
            <div style={{ background: p.white, borderRadius: 14, padding: "20px 20px 24px", boxShadow: "0 2px 12px rgba(0,77,77,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: p.deepTeal, fontWeight: 800, fontSize: 14, marginBottom: 14 }}>
                <Icons.GraduationCap />Covered in these courses
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {technique.courses.map((course, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: p.skyTeal, borderRadius: 8, cursor: "pointer" }}>
                    <span style={{ color: p.body, fontSize: 12, fontWeight: 500 }}>{course}</span>
                    <span style={{ color: p.orange }}><Icons.ArrowRight /></span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ background: "#006666", borderRadius: 14, padding: "20px 20px 24px" }}>
              <div style={{ color: p.lightTeal, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Go deeper</div>
              <p style={{ color: "#fff", fontSize: 13, lineHeight: 1.65, margin: "0 0 16px" }}>
                Want to practise this technique with your team? Book a free chemistry session to talk through how it applies to your context.
              </p>
              <button style={{ background: p.orange, color: "#fff", border: "none", padding: "11px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <Icons.Chat />Book a chemistry session
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* RELATED TECHNIQUES */}
      <div style={{ background: p.white, padding: isMobile ? "40px 20px" : "56px 48px" }}>
        <SectionHeading label="Keep exploring" title="Related techniques" />
        <div className="aa-related-grid">
          {technique.related.map((rel, i) => {
            const relCol = categoryColours[rel.category] || categoryColours.Analysis;
            return (
              <div key={i} style={{ background: p.white, borderRadius: 14, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,77,77,0.06)" }}>
                <div style={{ background: relCol.bg, padding: "14px 20px" }}>
                  <span style={{ background: relCol.pill, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>{rel.category}</span>
                </div>
                <div style={{ padding: "16px 20px 20px" }}>
                  <div style={{ color: p.deepTeal, fontSize: 16, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>{rel.title}</div>
                  <div style={{ color: p.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{rel.summary}</div>
                  <div style={{ color: p.deepTeal, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    Read more <Icons.ArrowRight />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: p.deepTeal, padding: isMobile ? "40px 20px 24px" : "48px 48px 32px" }}>
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
