import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { SITE_URL } from "@/config/featureFlags";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEvent } from "@/hooks/useEvent";
import { useEventTemplate } from "@/hooks/useEventTemplate";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { useUserRegistrations } from "@/hooks/useUserRegistrations";
import { useEventUnregistration } from "@/hooks/useEventUnregistration";
import { formatPrice } from "@/utils/currency";
import EventDetailSkeleton from "@/components/events/EventDetailSkeleton";
import EventDetailError from "@/components/events/EventDetailError";
import EventDetailContent from "@/components/events/EventDetailContent";
import EventDetailSidebar from "@/components/events/EventDetailSidebar";
import EventFeedbackSection from "@/components/events/EventFeedbackSection";
import type { EventData } from "@/hooks/useEvents";
import { colors as p } from '@/theme/colors';

function getDuration(event: EventData): string | null {
  const days = event.event_template?.duration_days;
  if (!days) return null;
  return days === 1 ? "1 Day" : `${days} Days`;
}

function formatDateRange(start: string, end: string | null): string {
  const s = format(new Date(start), "d MMM yyyy");
  if (!end || end === start) return s;
  return `${s} – ${format(new Date(end), "d MMM yyyy")}`;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isTemplateRoute = location.pathname.startsWith('/courses/');

  // Use the right hook depending on route
  const eventQuery = useEvent(isTemplateRoute ? '' : (id || ''));
  const templateQuery = useEventTemplate(isTemplateRoute ? (id || '') : '');

  const data = isTemplateRoute ? templateQuery.data : eventQuery.data;
  const isLoading = isTemplateRoute ? templateQuery.isLoading : eventQuery.isLoading;
  const error = isTemplateRoute ? templateQuery.error : eventQuery.error;
  const event = data;

  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { registerForEvent, loading: registrationLoading } = useEventRegistration();
  const { data: registrationsData } = useUserRegistrations();
  const registrations = registrationsData as import('@/hooks/useUserRegistrations').UserRegistrationWithEvent[] | undefined;
  const { unregisterFromEvent, loading: unregisterLoading } = useEventUnregistration();
  const [interestRegistered, setInterestRegistered] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1"><EventDetailSkeleton /></div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <EventDetailError />
        <Footer />
      </div>
    );
  }

  const isScheduled = !!event.start_date;
  const existingRegistration = registrations?.find(reg => reg.event_id === event.id);
  const isRegistered = !!existingRegistration;
  const levelName = event.level?.name || event.event_template?.levels?.name;
  const duration = getDuration(event);
  const templateTags = event.event_template?.template_tags;
  const priceDisplay = formatPrice(event.price_cents || 0, event.currency);
  const isFree = !event.price_cents || event.price_cents === 0;

  const handleUnregister = () => {
    if (existingRegistration) {
      unregisterFromEvent(existingRegistration.id);
    }
  };

  const ghostPillStyle: React.CSSProperties = {
    border: `1px solid ${p.lightTeal}`,
    color: p.lightTeal,
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 20,
    background: "transparent",
    display: "inline-block",
  };

  const metaItemStyle: React.CSSProperties = {
    color: p.lightTeal,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const actionBtnStyle: React.CSSProperties = {
    padding: "12px 28px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    border: "none",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: "background 0.2s ease",
    whiteSpace: "nowrap",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        .ed-body-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
          align-items: start;
        }
        .ed-action-bar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }
        .ed-meta-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: center;
        }
        @media (max-width: 767px) {
          .ed-body-grid {
            grid-template-columns: 1fr;
          }
          .ed-action-bar-inner {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }
          .ed-meta-strip {
            justify-content: center;
          }
        }
      `}</style>

      <Helmet>
        <title>{event.title} — Altogether Agile</title>
        {event.description && <meta name="description" content={event.description.slice(0, 160)} />}
        <meta property="og:title" content={event.title} />
        {event.description && <meta property="og:description" content={event.description.slice(0, 160)} />}
        <meta property="og:type" content="event" />
        <link rel="canonical" href={`${SITE_URL}/events/${id}`} />
      </Helmet>

      <Navigation />

      {/* Hero */}
      <div style={{ background: p.deepTeal, padding: "48px 0 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
          <Link to="/events" style={{
            color: p.lightTeal,
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
          }}>
            ← All Events
          </Link>

          {templateTags && templateTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {templateTags.map((tag, i) => (
                <span key={i} style={ghostPillStyle}>{tag}</span>
              ))}
            </div>
          )}

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            color: p.white,
            fontSize: isMobile ? 32 : 44,
            fontWeight: 400,
            lineHeight: 1.15,
            margin: "0 0 20px",
            letterSpacing: "-0.01em",
          }}>
            {event.title}
          </h1>

          <div className="ed-meta-strip">
            {isScheduled && (
              <span style={metaItemStyle}>
                {formatDateRange(event.start_date, event.end_date)}
              </span>
            )}
            {isScheduled && event.location && (
              <span style={metaItemStyle}>{event.location.name}</span>
            )}
            {duration && (
              <span style={metaItemStyle}>{duration}</span>
            )}
            {levelName && (
              <span style={metaItemStyle}>{levelName}</span>
            )}
            {!isScheduled && (
              <span style={{
                background: p.orange,
                color: p.white,
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 20,
              }}>Dates TBC</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {isScheduled ? (
        <div style={{ background: p.orange, padding: "16px 0" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }} className="ed-action-bar-inner">
            <div style={{ color: p.white, fontSize: 18, fontWeight: 700 }}>
              {priceDisplay} <span style={{ fontWeight: 400, fontSize: 14, opacity: 0.9 }}>+ VAT per delegate</span>
            </div>
            <div>
              {user ? (
                isRegistered ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: p.white, fontWeight: 600, fontSize: 14 }}>Already Registered</span>
                    <button
                      onClick={handleUnregister}
                      disabled={unregisterLoading}
                      style={{
                        ...actionBtnStyle,
                        background: "rgba(255,255,255,0.2)",
                        color: p.white,
                      }}
                    >
                      {unregisterLoading ? "..." : "Unregister"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => registerForEvent(event.id)}
                    disabled={registrationLoading}
                    style={{
                      ...actionBtnStyle,
                      background: p.deepTeal,
                      color: p.white,
                    }}
                  >
                    {registrationLoading ? "Processing..." : "Register Now"}
                  </button>
                )
              ) : (
                <button
                  onClick={() => registerForEvent(event.id)}
                  style={{
                    ...actionBtnStyle,
                    background: p.deepTeal,
                    color: p.white,
                  }}
                >
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: p.skyTeal, padding: "16px 0" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }} className="ed-action-bar-inner">
            <div style={{ color: p.deepTeal, fontSize: 15 }}>
              No dates scheduled
              {!isFree && (
                <span style={{ marginLeft: 12, color: p.muted }}>| Typical fee: {priceDisplay}</span>
              )}
            </div>
            <div>
              {interestRegistered ? (
                <span style={{ color: p.midTeal, fontWeight: 600, fontSize: 14 }}>
                  Interest registered!
                </span>
              ) : (
                <button
                  onClick={() => setInterestRegistered(true)}
                  style={{
                    ...actionBtnStyle,
                    background: p.orange,
                    color: p.white,
                  }}
                >
                  Register My Interest
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1" style={{ background: p.white }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
          <div className="ed-body-grid">
            <div>
              <EventDetailContent event={event} />
              <div style={{ marginTop: 40 }}>
                <EventFeedbackSection eventId={event.id} eventTitle={event.title} />
              </div>
            </div>
            <EventDetailSidebar event={event} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetail;
