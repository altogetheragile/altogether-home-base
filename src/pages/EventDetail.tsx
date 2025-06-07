
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, User, ArrowLeft } from "lucide-react";
import { useEvent } from "@/hooks/useEvent";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { formatPrice } from "@/utils/currency";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { registerForEvent, loading: registrationLoading } = useEventRegistration();
  const { data: event, isLoading, error } = useEvent(id || '');

  const formatPrice = (priceCents: number, currency: string = 'usd') => {
    if (priceCents === 0) return 'Free';
    const price = priceCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-24" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/events">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-muted/50 py-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              to="/events" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Events
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="border-border">
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">
                      {event.event_template?.event_types?.name || 'Event'}
                    </Badge>
                    <Badge variant="outline">
                      {event.event_template?.formats?.name || 'TBD'}
                    </Badge>
                    {event.event_template?.levels?.name && (
                      <Badge variant="outline">
                        {event.event_template.levels.name}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-3xl">{event.title}</CardTitle>
                  <CardDescription className="text-lg">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <h3 className="text-xl font-semibold mb-4">About This Event</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description || "More details about this event will be available soon."}
                    </p>
                    
                    {event.instructor?.bio && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">About the Instructor</h3>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium text-lg">{event.instructor.name}</h4>
                          <p className="text-muted-foreground mt-2">{event.instructor.bio}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details Card */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-3" />
                    <div>
                      <div className="font-medium text-foreground">
                        {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      {event.end_date && event.end_date !== event.start_date && (
                        <div className="text-sm">
                          Until {format(new Date(event.end_date), 'MMMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {event.event_template?.duration_days && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-3" />
                      <span>
                        {event.event_template.duration_days === 1 
                          ? 'Full Day Workshop' 
                          : `${event.event_template.duration_days} Day Program`
                        }
                      </span>
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-3" />
                      <div>
                        <div className="font-medium text-foreground">{event.location.name}</div>
                        {event.location.address && (
                          <div className="text-sm">{event.location.address}</div>
                        )}
                        {event.location.virtual_url && (
                          <div className="text-sm text-primary">Virtual Event</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {event.instructor && (
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-3" />
                      <span className="font-medium text-foreground">{event.instructor.name}</span>
                    </div>
                  )}
                  
                  <div className="text-lg font-semibold text-primary">
                    <span>{formatPrice(event.price_cents || 0, event.currency)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Card */}
              <Card className="border-border">
                <CardContent className="pt-6">
                  {user ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => registerForEvent(event.id)}
                      disabled={registrationLoading}
                    >
                      {registrationLoading ? "Processing..." : "Register Now"}
                    </Button>
                  ) : (
                    <Link to="/auth" className="block">
                      <Button className="w-full" size="lg">
                        Sign In to Register
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetail;
