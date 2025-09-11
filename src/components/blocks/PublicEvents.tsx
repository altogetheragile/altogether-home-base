import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/currency';

const PublicEvents = () => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_date,
          price_cents,
          currency,
          instructor:instructors(name),
          location:locations(name)
        `)
        .eq('is_published', true)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('❌ PublicEvents: Error fetching events:', error);
        throw error;
      }
      return data || [];
    },
  });

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading events…</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Failed to load events.</p>;
  }

  if (!events?.length) {
    return <p className="text-center text-gray-500">No upcoming events.</p>;
  }

  return (
    <Card>
      <CardContent>
        <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
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
                <TableCell>{String(event.title || 'Untitled')}</TableCell>
                <TableCell>
                  {event.start_date ? format(new Date(event.start_date), 'MMM dd, yyyy') : 'TBA'}
                </TableCell>
                <TableCell>{event.instructor?.name || 'TBA'}</TableCell>
                <TableCell>{event.location?.name || 'TBA'}</TableCell>
                <TableCell>
                  {formatPrice(event.price_cents || 0, event.currency || 'usd')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PublicEvents;
