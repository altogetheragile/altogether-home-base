
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useEvents } from "@/hooks/useEvents";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import EventsHeader from "@/components/events/EventsHeader";
import EventsList from "@/components/events/EventsList";

const Events = () => {
  const { data: events, isLoading, error } = useEvents();
  const { verifyPayment } = useEventRegistration();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    // Prevent multiple verification attempts
    if (verificationAttempted.current) return;

    if (success === 'true' && sessionId) {
      verificationAttempted.current = true;
      
      // Add a small delay before verification to allow Stripe to process
      setTimeout(() => {
        verifyPayment(sessionId).then((result) => {
          if (result?.payment_status === 'paid') {
            toast({
              title: "Registration successful!",
              description: "You have successfully registered for the event.",
            });
          }
        });
      }, 2000); // 2 second delay
    }

    if (canceled === 'true') {
      toast({
        title: "Registration canceled",
        description: "Your registration was canceled. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, verifyPayment, toast]);

  if (error) {
    console.error('Events page error:', error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="flex-1">
        <EventsHeader />

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EventsList events={events} isLoading={isLoading} />
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Events;
