import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { formatPrice } from "@/utils/currency";
import { EventData } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { useUserRegistrations, UserRegistrationWithEvent } from "@/hooks/useUserRegistrations";
import { useEventUnregistration } from "@/hooks/useEventUnregistration";

const p = {
  deepTeal: "#004D4D",
  midTeal: "#006666",
  lightTeal: "#B2DFDF",
  paleTeal: "#D9F2F2",
  skyTeal: "#F0FAFA",
  orange: "#FF9715",
  body: "#374151",
  muted: "#6B7280",
  white: "#FFFFFF",
};

interface EventDetailSidebarProps {
  event: EventData;
}

const DifficultyPips = ({ level }: { level?: 'beginner' | 'intermediate' | 'advanced' }) => {
  const filled = level === 'advanced' ? 3 : level === 'intermediate' ? 2 : 1;
  const label = level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Beginner';
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: i <= filled ? p.orange : p.lightTeal,
        }} />
      ))}
      <span style={{ color: p.muted, fontSize: 13, marginLeft: 4 }}>{label}</span>
    </div>
  );
};

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${p.paleTeal}`,
  }}>
    <span style={{ color: p.muted, fontSize: 14 }}>{label}</span>
    <span style={{ color: p.deepTeal, fontSize: 14, fontWeight: 700 }}>{value}</span>
  </div>
);

const EventDetailSidebar = ({ event }: EventDetailSidebarProps) => {
  const { user } = useAuth();
  const { registerForEvent, loading: registrationLoading } = useEventRegistration();
  const { data: registrations } = useUserRegistrations();
  const { unregisterFromEvent, loading: unregisterLoading } = useEventUnregistration();
  const [interestRegistered, setInterestRegistered] = useState(false);

  const existingRegistration = (registrations as UserRegistrationWithEvent[] | undefined)?.find((reg: UserRegistrationWithEvent) => reg.event_id === event.id);
  const isRegistered = !!existingRegistration;
  const isUpcoming = event.start_date ? new Date(event.start_date) > new Date() : false;
  const isScheduled = !!event.start_date;

  const handleUnregister = () => {
    if (existingRegistration) {
      unregisterFromEvent(existingRegistration.id);
    }
  };

  const durationDays = event.event_template?.duration_days;
  const durationLabel = durationDays
    ? durationDays === 1 ? "1 Day" : `${durationDays} Days`
    : null;
  const formatName = event.format?.name || event.event_template?.formats?.name;
  const instructorName = event.instructor?.name;
  const templateTags = event.event_template?.template_tags;
  const difficultyRating = event.event_template?.difficulty_rating;
  const priceDisplay = formatPrice(event.price_cents || 0, event.currency);
  const isFree = !event.price_cents || event.price_cents === 0;

  const pillStyle: React.CSSProperties = {
    background: p.paleTeal,
    color: p.deepTeal,
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 20,
    display: "inline-block",
  };

  const buttonStyle: React.CSSProperties = {
    background: p.orange,
    color: p.white,
    border: "none",
    padding: "14px 24px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    width: "100%",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: "background 0.2s ease",
  };

  if (isScheduled) {
    // ── Scheduled Mode ──
    return (
      <div style={{ position: "sticky", top: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Header */}
        <div style={{
          background: p.deepTeal,
          borderRadius: "12px 12px 0 0",
          padding: "24px 24px 20px",
        }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            color: p.white,
            fontSize: 32,
            fontWeight: 400,
          }}>{priceDisplay}</div>
          <div style={{ color: p.lightTeal, fontSize: 13, marginTop: 4 }}>+ VAT per delegate</div>
        </div>

        {/* Body */}
        <div style={{
          background: p.white,
          border: `1px solid ${p.lightTeal}`,
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "20px 24px 24px",
        }}>
          <MetaRow label="Start date" value={format(new Date(event.start_date), 'd MMM yyyy')} />
          {event.end_date && event.end_date !== event.start_date && (
            <MetaRow label="End date" value={format(new Date(event.end_date), 'd MMM yyyy')} />
          )}
          {durationLabel && <MetaRow label="Duration" value={durationLabel} />}
          {event.location && <MetaRow label="Location" value={event.location.name} />}
          {instructorName && <MetaRow label="Instructor" value={instructorName} />}

          {difficultyRating && (
            <div style={{ padding: "12px 0" }}>
              <DifficultyPips level={difficultyRating} />
            </div>
          )}

          {/* Registration */}
          <div style={{ marginTop: 16 }}>
            {user ? (
              isRegistered ? (
                <div>
                  <div style={{
                    textAlign: "center",
                    color: p.midTeal,
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 10,
                  }}>Already Registered</div>
                  {isUpcoming && (
                    <button
                      onClick={handleUnregister}
                      disabled={unregisterLoading}
                      style={{
                        ...buttonStyle,
                        background: p.white,
                        color: p.muted,
                        border: `1px solid ${p.lightTeal}`,
                      }}
                    >
                      {unregisterLoading ? "Unregistering..." : "Unregister"}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => registerForEvent(event.id)}
                  disabled={registrationLoading}
                  style={buttonStyle}
                >
                  {registrationLoading ? "Processing..." : "Register Now"}
                </button>
              )
            ) : (
              <Link to="/auth" style={{ textDecoration: "none" }}>
                <button style={buttonStyle}>Sign In to Register</button>
              </Link>
            )}
          </div>

          {/* Get in touch link */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link to="/contact" style={{
              color: p.orange,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
            }}>
              Have a question? Get in touch →
            </Link>
          </div>

          {/* Template tags */}
          {templateTags && templateTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {templateTags.map((tag, i) => (
                <span key={i} style={pillStyle}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Unscheduled Mode ──
  return (
    <div style={{
      position: "sticky",
      top: 24,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      border: `2px dashed ${p.lightTeal}`,
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: p.skyTeal,
        padding: "24px 24px 20px",
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          color: p.deepTeal,
          fontSize: 22,
          fontWeight: 400,
          marginBottom: 8,
        }}>No Dates Scheduled Yet</div>
        <p style={{ color: p.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          This course is available for private or scheduled delivery. Register your interest and we'll notify you when dates are confirmed.
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px 24px" }}>
        {durationLabel && <MetaRow label="Typical duration" value={durationLabel} />}
        {formatName && <MetaRow label="Format" value={formatName} />}

        {difficultyRating && (
          <div style={{ padding: "12px 0" }}>
            <DifficultyPips level={difficultyRating} />
          </div>
        )}

        {/* Indicative price */}
        {!isFree && (
          <div style={{
            background: p.paleTeal,
            borderRadius: 8,
            padding: "14px 16px",
            marginTop: 12,
          }}>
            <div style={{ color: p.deepTeal, fontSize: 18, fontWeight: 700 }}>{priceDisplay}</div>
            <div style={{ color: p.muted, fontSize: 12, marginTop: 2 }}>Indicative price, subject to confirmation</div>
          </div>
        )}

        {/* Register My Interest */}
        <div style={{ marginTop: 16 }}>
          {interestRegistered ? (
            <div style={{
              textAlign: "center",
              background: p.skyTeal,
              borderRadius: 10,
              padding: "16px",
            }}>
              <div style={{ color: p.midTeal, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                Thanks for your interest!
              </div>
              <div style={{ color: p.muted, fontSize: 13 }}>
                We'll be in touch when dates are confirmed.
              </div>
            </div>
          ) : (
            <button
              onClick={() => setInterestRegistered(true)}
              style={buttonStyle}
            >
              Register My Interest
            </button>
          )}
        </div>

        {/* Private delivery link */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/contact" style={{
            color: p.orange,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
          }}>
            Want to run this privately? Get in touch →
          </Link>
        </div>

        {/* Template tags */}
        {templateTags && templateTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
            {templateTags.map((tag, i) => (
              <span key={i} style={pillStyle}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailSidebar;
