import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { formatPrice } from "@/utils/currency";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PublicEventsProps {
  block: any;
}

const PublicEvents = ({ block }: PublicEventsProps) => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      console.log("🌐 PublicEvents: fetching visible events...");
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          start_date,
          price_cents,
          currency,
          instructor:instructors(name),
          location:locations(name)
        `
        )
        .eq("is_published", true)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("❌ PublicEvents query error", error);
        throw error;
      }
      return data || [];
    },
  });

  if (isLoading) {
    return <p>Loading events...</p>;
  }

  if (error) {
    return <p className="text-red-500">Failed to load events.</p>;
  }

  if (!events || events.length === 0) {
    return <p>No upcoming events found.</p>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card key={event.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{String(event.title || "Untitled Event")}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <p className="text-gray-600">
              📅 {event.start_date ? format(new Date(event.start_date), "PPP") : "TBA"}
            </p>
            <p className="text-gray-600">
              👤 {event.instructor?.name || "TBA"}
            </p>
            <p className="text-gray-600">
              📍 {event.location?.name || "TBA"}
            </p>
            <p className="font-semibold">
              💰 {formatPrice(event.price_cents || 0, event.currency || "usd")}
            </p>
            <Link to={`/events/${event.id}`}>
              <Button className="mt-3 w-full">View Details</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PublicEvents;
