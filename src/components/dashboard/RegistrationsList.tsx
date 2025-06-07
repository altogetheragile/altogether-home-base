
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import RegistrationCard from "./RegistrationCard";
import { UserRegistration } from "@/hooks/useUserRegistrations";

interface RegistrationsListProps {
  registrations?: UserRegistration[];
  isLoading: boolean;
}

const RegistrationsList = ({ registrations, isLoading }: RegistrationsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="border-border">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-foreground mb-4">No Registrations Yet</h2>
        <p className="text-muted-foreground mb-6">
          You haven't registered for any events yet. Browse our available events to get started.
        </p>
        <a href="/events" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Browse Events
        </a>
      </div>
    );
  }

  // Separate upcoming and past events
  const now = new Date();
  const upcomingRegistrations = registrations.filter(
    registration => new Date(registration.event.start_date) > now
  );
  const pastRegistrations = registrations.filter(
    registration => new Date(registration.event.start_date) <= now
  );

  return (
    <div className="space-y-8">
      {upcomingRegistrations.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingRegistrations.map((registration) => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))}
          </div>
        </div>
      )}

      {pastRegistrations.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Events</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pastRegistrations.map((registration) => (
              <RegistrationCard key={registration.id} registration={registration} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationsList;
