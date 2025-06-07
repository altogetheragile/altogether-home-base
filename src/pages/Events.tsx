import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const Events = () => {
  const { data: events, isLoading, error } = useEvents();

  if (error) {
    console.error('Events page error:', error);
  }

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
                      </div>
                      <Link to="/auth">
                        <Button className="w-full">
                          Sign In to Register
                        </Button>
                      </Link>
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
