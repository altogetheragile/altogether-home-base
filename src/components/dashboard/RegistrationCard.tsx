
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { UserRegistrationWithEvent } from "@/hooks/useUserRegistrations";
import { formatPrice } from "@/utils/currency";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

interface RegistrationCardProps {
  registration: UserRegistrationWithEvent;
}

const RegistrationCard = ({ registration }: RegistrationCardProps) => {
  const { event, payment_status, registered_at } = registration;
  const { user } = useAuth();
  const { data: userRole } = useUserRole();
  
  // Don't render if event data is missing
  if (!event) {
    return (
      <Card className="border-border opacity-50">
        <CardHeader>
          <CardTitle className="text-xl">Event Not Found</CardTitle>
          <CardDescription>
            Registered on {format(new Date(registered_at), 'MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The event details could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }

  const isUpcoming = new Date(event.start_date) > new Date();
  
  // Check if user can edit this event (admin only)
  const canEditEvent = userRole === 'admin';

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-border hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant={isUpcoming ? "default" : "secondary"}>
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
          {getPaymentStatusBadge(payment_status)}
        </div>
        <CardTitle className="text-xl">{event.title}</CardTitle>
        <CardDescription>
          Registered on {format(new Date(registered_at), 'MMMM d, yyyy')}
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
          
          <div className="text-lg font-semibold text-primary">
            <span>{formatPrice(event.price_cents, event.currency)}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link to={`/events/${event.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          {canEditEvent && (
            <Link to={`/admin/events/${event.id}/edit`} className="flex-1">
              <Button variant="default" className="w-full">
                Edit Event
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RegistrationCard;
