
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventData } from "@/hooks/useEvents";

interface EventDetailContentProps {
  event: EventData;
}

const EventDetailContent = ({ event }: EventDetailContentProps) => {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">
            {event.event_type?.name || event.event_template?.event_types?.name || 'Event'}
          </Badge>
          <Badge variant="outline">
            {event.format?.name || event.event_template?.formats?.name || 'TBD'}
          </Badge>
          {(event.level?.name || event.event_template?.levels?.name) && (
            <Badge variant="outline">
              {event.level?.name || event.event_template?.levels?.name}
            </Badge>
          )}
          {(event.category?.name || event.event_template?.categories?.name) && (
            <Badge variant="outline">
              {event.category?.name || event.event_template?.categories?.name}
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
  );
};

export default EventDetailContent;
