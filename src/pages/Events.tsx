
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";

const Events = () => {
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Event Card Placeholder */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">Workshop</Badge>
                    <Badge variant="outline">In-Person</Badge>
                  </div>
                  <CardTitle className="text-xl">Agile Fundamentals Workshop</CardTitle>
                  <CardDescription>
                    Learn the core principles and practices of agile methodologies in this hands-on workshop.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Date: TBD (Connect to Supabase for live data)</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Duration: Full Day</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Location: TBD</span>
                    </div>
                  </div>
                  <Button className="w-full" disabled>
                    Registration Opens Soon
                  </Button>
                </CardContent>
              </Card>

              {/* Event Card Placeholder */}
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">Coaching</Badge>
                    <Badge variant="outline">Virtual</Badge>
                  </div>
                  <CardTitle className="text-xl">Scrum Master Certification</CardTitle>
                  <CardDescription>
                    Comprehensive certification program for aspiring and current Scrum Masters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Date: TBD (Connect to Supabase for live data)</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Duration: 2 Days</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Location: Online</span>
                    </div>
                  </div>
                  <Button className="w-full" disabled>
                    Registration Opens Soon
                  </Button>
                </CardContent>
              </Card>

            </div>

            {/* No Events Message */}
            <div className="text-center mt-16 p-8 bg-muted/50 rounded-lg">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Events Coming Soon
              </h3>
              <p className="text-muted-foreground mb-6">
                We're preparing exciting new training sessions and workshops. 
                Once connected to Supabase, this page will display live event data, 
                registration forms, and payment processing through Stripe.
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
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Events;
