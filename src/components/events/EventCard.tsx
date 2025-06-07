
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { EventData } from "@/hooks/useEvents";

interface EventCardProps {
  event: EventData;
}

const EventCard = ({ event }: EventCardProps) => {
  const { registerForEvent, loading: registrationLoading } = useEventRegistration();
  const { user } = useAuth();

  const formatPrice = (priceCents: number, currency: string = 'usd') => {
    if (priceCents === 0) return 'Free';
    const price = priceCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  return (
    <Card className="border-border hover:shadow-lg transition-shadow">
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
        
        <div className="flex gap-3">
          <Link to={`/events/${event.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          {user ? (
            <Button 
              className="flex-1"
              onClick={() => registerForEvent(event.id)}
              disabled={registrationLoading}
            >
              {registrationLoading ? "Processing..." : "Register"}
            </Button>
          ) : (
            <Link to="/auth" className="flex-1">
              <Button className="w-full">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
