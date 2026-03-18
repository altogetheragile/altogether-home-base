import { useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { EventData } from "@/hooks/useEvents";
import { colors as p } from '@/theme/colors';

interface EventDetailContentProps {
  event: EventData;
}

const EventDetailContent = ({ event }: EventDetailContentProps) => {
  const [expanded, setExpanded] = useState(false);
  const description = event.description || "";
  const needsToggle = description.length > 220;
  const displayText = needsToggle && !expanded ? description.slice(0, 220) + "..." : description;

  const learningOutcomes = event.event_template?.learning_outcomes;
  const keyBenefits = event.event_template?.key_benefits;
  const targetAudience = event.event_template?.target_audience;
  const prerequisites = event.event_template?.prerequisites;
  const hasWhoOrPrereqs = !!targetAudience || (prerequisites && prerequisites.length > 0);

  return (
    <>
      <style>{`
        .ed-benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .ed-who-prereqs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .ed-markdown h2 { font-family: 'DM Serif Display', serif; color: ${p.deepTeal}; font-size: 22px; font-weight: 400; margin: 28px 0 12px; }
        .ed-markdown h3 { font-family: 'DM Sans', system-ui, sans-serif; color: ${p.deepTeal}; font-size: 18px; font-weight: 700; margin: 24px 0 8px; }
        .ed-markdown p { margin: 0 0 16px; }
        .ed-markdown ul, .ed-markdown ol { padding-left: 24px; margin: 0 0 16px; }
        .ed-markdown li { margin-bottom: 6px; }
        .ed-markdown strong { color: ${p.deepTeal}; }
        @media (max-width: 767px) {
          .ed-benefits-grid {
            grid-template-columns: 1fr;
          }
          .ed-who-prereqs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* About This Course */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            color: p.deepTeal,
            fontSize: 28,
            fontWeight: 400,
            margin: "0 0 16px",
          }}>About This Course</h2>
          {needsToggle && !expanded ? (
            <p style={{ color: p.body, fontSize: 16, lineHeight: 1.8, margin: 0 }}>
              {displayText}
            </p>
          ) : (
            <div className="ed-markdown" style={{ color: p.body, fontSize: 16, lineHeight: 1.8 }}>
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          )}
          {needsToggle && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                color: p.orange,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                padding: "8px 0 0",
                fontFamily: "inherit",
              }}
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          )}
        </section>

        {/* What You'll Learn */}
        {learningOutcomes && learningOutcomes.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              color: p.deepTeal,
              fontSize: 28,
              fontWeight: 400,
              margin: "0 0 20px",
            }}>What You'll Learn</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {learningOutcomes.map((outcome, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: p.midTeal,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={p.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span style={{ color: p.body, fontSize: 15, lineHeight: 1.6 }}>{outcome}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Why This Course */}
        {keyBenefits && keyBenefits.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              color: p.deepTeal,
              fontSize: 28,
              fontWeight: 400,
              margin: "0 0 20px",
            }}>Why This Course</h2>
            <div className="ed-benefits-grid">
              {keyBenefits.map((benefit, i) => (
                <div key={i} style={{
                  background: p.skyTeal,
                  borderLeft: `3px solid ${p.orange}`,
                  borderRadius: 8,
                  padding: "16px 20px",
                }}>
                  <span style={{ color: p.body, fontSize: 15, lineHeight: 1.6 }}>{benefit}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Who Is This For + Prerequisites */}
        {hasWhoOrPrereqs && (
          <section style={{ marginBottom: 40 }}>
            <div className="ed-who-prereqs-grid" style={
              // Full width if only one exists
              (!targetAudience || !(prerequisites && prerequisites.length > 0))
                ? { gridTemplateColumns: "1fr" }
                : undefined
            }>
              {targetAudience && (
                <div>
                  <h2 style={{
                    fontFamily: "'DM Serif Display', serif",
                    color: p.deepTeal,
                    fontSize: 24,
                    fontWeight: 400,
                    margin: "0 0 16px",
                  }}>Who Is This For</h2>
                  <div style={{
                    background: p.paleTeal,
                    borderRadius: 10,
                    padding: "20px 24px",
                  }}>
                    <p style={{ color: p.body, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                      {targetAudience}
                    </p>
                  </div>
                </div>
              )}
              {prerequisites && prerequisites.length > 0 && (
                <div>
                  <h2 style={{
                    fontFamily: "'DM Serif Display', serif",
                    color: p.deepTeal,
                    fontSize: 24,
                    fontWeight: 400,
                    margin: "0 0 16px",
                  }}>Prerequisites</h2>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                    {prerequisites.map((prereq, i) => (
                      <li key={i} style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 10,
                      }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: p.orange,
                          flexShrink: 0,
                          marginTop: 7,
                        }} />
                        <span style={{ color: p.body, fontSize: 15, lineHeight: 1.6 }}>{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Your Instructor */}
        {!!event.start_date && event.instructor && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              color: p.deepTeal,
              fontSize: 28,
              fontWeight: 400,
              margin: "0 0 16px",
            }}>Your Instructor</h2>
            <div style={{
              background: p.skyTeal,
              borderRadius: 12,
              padding: "24px 28px",
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: p.deepTeal,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  color: p.white,
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}>
                  {event.instructor.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 style={{
                  fontFamily: "'DM Serif Display', serif",
                  color: p.deepTeal,
                  fontSize: 20,
                  fontWeight: 400,
                  margin: "0 0 8px",
                }}>{event.instructor.name}</h3>
                {event.instructor.bio && (
                  <p style={{ color: p.body, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                    {event.instructor.bio}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Private delivery callout */}
        <section style={{
          border: `2px dashed ${p.lightTeal}`,
          borderRadius: 12,
          padding: "28px 24px",
          textAlign: "center",
        }}>
          <p style={{ color: p.body, fontSize: 16, margin: "0 0 12px" }}>
            Want to run this course privately for your team?
          </p>
          <Link to="/contact" style={{
            color: p.orange,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            Get in touch →
          </Link>
        </section>
      </div>
    </>
  );
};

export default EventDetailContent;
