
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User, Star, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { EventData } from "@/hooks/useEvents";
import { formatPrice } from "@/utils/currency";
import TemplateBadge from "./TemplateBadge";
import DifficultyBadge from "./DifficultyBadge";

interface EventCardProps {
  event: EventData;
}

const EventCard = ({ event }: EventCardProps) => {
  const { registerForEvent, loading: registrationLoading } = useEventRegistration();
  const { user } = useAuth();

  // Template branding data
  const templateBrandColor = event.event_template?.brand_color || '#3B82F6';
  const templateDifficulty = event.event_template?.difficulty_rating;
  const templatePopularity = event.event_template?.popularity_score || 0;

  return (
    <Card className="group border-border hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Template-branded header accent */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: templateBrandColor }}
      />
      
      <CardHeader>
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="secondary"
              style={{ 
                backgroundColor: `${templateBrandColor}15`,
                color: templateBrandColor,
                borderColor: `${templateBrandColor}30`
              }}
            >
              {event.event_type?.name || event.event_template?.event_types?.name || 'Event'}
            </Badge>
            <Badge variant="outline">
              {event.format?.name || event.event_template?.formats?.name || 'TBD'}
            </Badge>
            {templatePopularity > 50 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Star size={12} fill="currentColor" />
                Popular
              </Badge>
            )}
          </div>
          {templateDifficulty && (
            <DifficultyBadge difficulty={templateDifficulty} />
          )}
        </div>
        
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {event.description}
        </CardDescription>
        
        {/* Template badge */}
        {event.event_template && (
          <div className="pt-2">
            <TemplateBadge 
              template={event.event_template} 
              variant="outline" 
              className="text-xs"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {format(new Date(event.start_date), 'MMM d, yyyy')}
                {event.end_date && event.end_date !== event.start_date && 
                  ` - ${format(new Date(event.end_date), 'MMM d, yyyy')}`
                }
              </span>
            </div>
            {(event.event_template?.duration_days && event.event_template.duration_days > 1) && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{event.event_template.duration_days} days</span>
              </div>
            )}
          </div>
          
          {event.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="truncate">{event.location.name}</span>
            </div>
          )}
          
          {event.instructor && (
            <div className="flex items-center text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span className="truncate">{event.instructor.name}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-muted-foreground" />
              <span className="text-lg font-semibold text-foreground">
                {formatPrice(event.price_cents || 0, event.currency)}
              </span>
            </div>
            {templatePopularity > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users size={12} />
                <span>Popular choice</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Link to={`/events/${event.id}`} className="block">
            <Button variant="outline" className="w-full hover:shadow-md transition-shadow">
              View Details
            </Button>
          </Link>
          {user ? (
            <Button 
              className="w-full font-medium hover:shadow-md transition-shadow"
              onClick={() => registerForEvent(event.id)}
              disabled={registrationLoading}
              style={{ backgroundColor: templateBrandColor }}
            >
              {registrationLoading ? "Processing..." : "Register Now"}
            </Button>
          ) : (
            <Link to="/auth" className="block">
              <Button variant="secondary" className="w-full font-medium">
                Sign In to Register
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
