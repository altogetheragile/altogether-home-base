
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User, DollarSign } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Events = () => {
  const { data: events, isLoading, error } = useEvents();
  const { registerForEvent, verifyPayment, loading: registrationLoading } = useEventRegistration();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      verifyPayment(sessionId).then((result) => {
        if (result?.payment_status === 'paid') {
          toast({
            title: "Registration successful!",
            description: "You have successfully registered for the event.",
          });
        }
      });
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

  const formatPrice = (priceCents: number, currency: string = 'usd') => {
    if (priceCents === 0) return 'Free';
    const price = priceCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-b from-background to-muted py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Upcoming Events
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join our workshops, training sessions, and coaching programs designed to 
              accelerate your agile transformation journey.
            </p>
          </div>
        </section>

        {/* Events List */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-border">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-6">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {events.map((event) => (
                  <Card key={event.id} className="border-border hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary">
                          {event.event_template?.event_types?.name || 'Event'}
                        </Badge>
                        <Badge variant="outline">
                          {event.event_template?.formats?.name || 'TBD'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <CardDescription>
                        {event.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {format(new Date(event.start_date), 'MMMM d, yyyy')}
                            {event.end_date && event.end_date !== event.start_date && 
                              ` - ${format(new Date(event.end_date), 'MMMM d, yyyy')}`
                            }
                          </span>
                        </div>
                        {event.event_template?.duration_days && (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {event.event_template.duration_days === 1 
                                ? 'Full Day' 
                                : `${event.event_template.duration_days} Days`
                              }
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{event.location.name}</span>
                          </div>
                        )}
                        {event.instructor && (
                          <div className="flex items-center text-muted-foreground">
                            <User className="h-4 w-4 mr-2" />
                            <span>{event.instructor.name}</span>
                          </div>
                        )}
                        <div className="flex items-center text-lg font-semibold text-primary">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>{formatPrice(event.price_cents || 0, event.currency)}</span>
                        </div>
                      </div>
                      
                      {user ? (
                        <Button 
                          className="w-full" 
                          onClick={() => registerForEvent(event.id)}
                          disabled={registrationLoading}
                        >
                          {registrationLoading ? "Processing..." : "Register Now"}
                        </Button>
                      ) : (
                        <Link to="/auth">
                          <Button className="w-full">
                            Sign In to Register
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  No Events Scheduled
                </h3>
                <p className="text-muted-foreground mb-6">
                  We're preparing exciting new training sessions and workshops. 
                  Check back soon for upcoming events!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline">
                    Subscribe to Updates
                  </Button>
                  <Button variant="outline">
                    Contact Us
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Events;
