
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { formatPrice } from "@/utils/currency";
import { EventData } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";

interface EventDetailSidebarProps {
  event: EventData;
}

const EventDetailSidebar = ({ event }: EventDetailSidebarProps) => {
  const { user } = useAuth();
  const { registerForEvent, loading: registrationLoading } = useEventRegistration();

  return (
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
  );
};

export default EventDetailSidebar;
