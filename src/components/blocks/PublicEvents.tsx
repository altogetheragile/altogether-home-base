import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatPrice } from "@/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PublicEvents = ({ block }: { block: any }) => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          instructor:instructors(name),
          location:locations(name)
        `)
        .eq("is_published", true)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">Failed to load events.</div>;
  }

  if (!events?.length) {
    return <div className="text-center text-gray-500 py-8">No upcoming events.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        {block?.content?.title || "Upcoming Events"}
      </h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event: any) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  {String(event.title || "Untitled")}
                </TableCell>
                <TableCell>{format(new Date(event.start_date), "MMM dd, yyyy")}</TableCell>
                <TableCell>{event.instructor?.name || "TBA"}</TableCell>
                <TableCell>{event.location?.name || "TBA"}</TableCell>
                <TableCell>
                  {formatPrice(event.price_cents || 0, event.currency || "usd")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PublicEvents;
