
import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEvent } from "@/hooks/useEvent";
import EventDetailSkeleton from "@/components/events/EventDetailSkeleton";
import EventDetailError from "@/components/events/EventDetailError";
import EventDetailBreadcrumb from "@/components/events/EventDetailBreadcrumb";
import EventDetailContent from "@/components/events/EventDetailContent";
import EventDetailSidebar from "@/components/events/EventDetailSidebar";
import EventFeedbackSection from "@/components/events/EventFeedbackSection";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useEvent(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1">
          <EventDetailSkeleton />
        </div>
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="flex-1">
        <EventDetailBreadcrumb />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <EventDetailContent event={event} />
              <EventFeedbackSection eventId={event.id} eventTitle={event.title} />
            </div>

            {/* Sidebar */}
            <EventDetailSidebar event={event} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetail;
