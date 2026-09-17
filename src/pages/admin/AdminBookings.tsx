import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AlertTriangle, CalendarDays, Video } from 'lucide-react';
import { BookingAvailabilityEditor } from '@/components/admin/bookings/BookingAvailabilityEditor';

/**
 * Training > Bookings.
 *
 * Reads and writes the booking tables directly through RLS (is_admin()), so it
 * works before either edge function exists. The one thing it cannot do yet is
 * tidy up in Zoom and Google when a booking is cancelled - that needs the
 * secrets - so the cancel dialog says so plainly rather than implying the
 * meeting has gone away.
 */

type BookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  guest_name: string;
  guest_email: string;
  guest_timezone: string;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  /**
   * Why booking-create gave up: zoom, calendar or timeout. Null means a person
   * cancelled it. Both land on status 'cancelled', because that is what frees
   * the slot, so this is the only thing telling the two apart.
   */
  failure_reason: string | null;
  meeting_url: string | null;
  meeting_id: string | null;
  calendar_event_id: string | null;
  created_at: string;
  booking_types: { name: string; slug: string } | null;
};

type Filter = 'upcoming' | 'past' | 'pending' | 'cancelled' | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  confirmed: 'default',
  pending: 'secondary',
  cancelled: 'outline',
  failed: 'destructive',
};

/**
 * What to call a row in the status column.
 *
 * A booking the system abandoned is stored as cancelled so it stops blocking
 * the slot, but calling it "cancelled" next to the ones Al cancelled himself
 * hides the thing worth knowing: something broke, and the guest got nothing.
 */
function statusLabel(b: BookingRow): string {
  if (b.failure_reason) return `failed (${b.failure_reason})`;
  return b.status;
}

/** Office time, so Al reads every booking in the zone he works in. */
const londonFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const inLondon = (iso: string) => londonFormatter.format(new Date(iso));

/** Opens Google Calendar on the day of the booking. */
const calendarDayUrl = (iso: string) =>
  `https://calendar.google.com/calendar/u/0/r/day/${new Date(iso)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '/')}`;

const AdminBookings = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [cancelling, setCancelling] = useState<BookingRow | null>(null);

  const { data: bookings, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async (): Promise<BookingRow[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, starts_at, ends_at, guest_name, guest_email, guest_timezone, notes, status, ' +
            'meeting_url, meeting_id, calendar_event_id, created_at, booking_types(name, slug)',
        )
        .order('starts_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as BookingRow[];
    },
  });

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Booking cancelled', {
        description: 'The slot is free again. Remove the Zoom meeting and calendar event by hand for now.',
      });
      setCancelling(null);
    },
    onError: (e: Error) => toast.error('Could not cancel', { description: e.message }),
  });

  // The split between upcoming and past is taken at the moment the data was
  // fetched, not at render. That keeps it consistent with the rows on screen and
  // keeps render pure - Date.now() during render is unstable across re-renders.
  const filtered = useMemo(() => {
    if (!bookings) return [];
    const now = dataUpdatedAt;

    switch (filter) {
      case 'upcoming':
        return bookings.filter(
          (b) => b.status !== 'cancelled' && new Date(b.starts_at).getTime() >= now,
        );
      case 'past':
        return bookings.filter(
          (b) => b.status !== 'cancelled' && new Date(b.starts_at).getTime() < now,
        );
      case 'pending':
        return bookings.filter((b) => b.status === 'pending');
      case 'cancelled':
        return bookings.filter((b) => b.status === 'cancelled');
      default:
        return bookings;
    }
  }, [bookings, filter, dataUpdatedAt]);

  /**
   * Bookings where the guest got nothing, and nobody would otherwise look.
   *
   * Two shapes. A row still pending after five minutes means the invocation
   * died before it could even record a failure. A row carrying a
   * failure_reason means Zoom or Google refused and we gave up on purpose.
   * Both mean somebody tried to book and has no meeting.
   *
   * Only the last day: an old failure is history, not a thing to act on.
   */
  const stuck = useMemo(
    () =>
      (bookings ?? []).filter((b) => {
        const age = dataUpdatedAt - new Date(b.created_at).getTime();
        if (age > 24 * 60 * 60_000) return false;
        if (b.failure_reason) return true;
        return b.status === 'pending' && age > 5 * 60_000;
      }),
    [bookings, dataUpdatedAt],
  );

  const columns: DataTableColumn<BookingRow>[] = [
    {
      id: 'guest',
      header: 'Guest',
      sortable: true,
      sortValue: (b) => b.guest_name,
      cell: (b) => (
        <div>
          <div className="font-medium">{b.guest_name}</div>
          <div className="text-xs text-muted-foreground">{b.guest_email}</div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      sortable: true,
      sortValue: (b) => b.booking_types?.name ?? '',
      cell: (b) => b.booking_types?.name ?? '-',
    },
    {
      id: 'starts_at',
      header: 'Start (London)',
      sortable: true,
      sortValue: (b) => b.starts_at,
      cell: (b) => (
        <div>
          <div>{inLondon(b.starts_at)}</div>
          {b.guest_timezone !== 'Europe/London' && (
            <div className="text-xs text-muted-foreground">Guest in {b.guest_timezone}</div>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (b) => statusLabel(b),
      cell: (b) => (
        <Badge variant={statusVariant[b.failure_reason ? 'failed' : b.status] ?? 'default'}>
          {statusLabel(b)}
        </Badge>
      ),
    },
    {
      id: 'links',
      header: 'Links',
      cell: (b) => (
        <div className="flex items-center gap-3">
          {b.meeting_url ? (
            <a
              href={b.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Video className="h-3.5 w-3.5" /> Zoom
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">No meeting</span>
          )}
          <a
            href={calendarDayUrl(b.starts_at)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm underline"
            onClick={(e) => e.stopPropagation()}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </a>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (b) =>
        b.status === 'cancelled' ? null : (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCancelling(b);
            }}
          >
            Cancel
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          One-to-one sessions booked from the site. Times shown in Europe/London.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Layer 1 is part built. Bookings are listed and availability is editable here, but the
          booking page cannot take a booking until the <code>booking-slots</code> and{' '}
          <code>booking-create</code> edge functions are deployed, which needs the Zoom and Google
          secrets. Cancelling here frees the slot; it does not yet remove the Zoom meeting or the
          calendar event.
        </AlertDescription>
      </Alert>

      {stuck.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stuck.length} booking{stuck.length === 1 ? '' : 's'} in the last day
            {stuck.length === 1 ? ' has' : ' have'} failed part way through, so the guest has no
            meeting. The slot has been put back on sale. Check the edge function logs, and email
            them if they left an address.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Bookings</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All bookings</CardTitle>
              <CardDescription>
                {bookings?.length ?? 0} in total, {filtered.length} shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filtered}
                columns={columns}
                rowKey={(b) => b.id}
                isLoading={isLoading}
                searchable
                searchPlaceholder="Search guest or email"
                getSearchText={(b) => `${b.guest_name} ${b.guest_email} ${b.booking_types?.name ?? ''}`}
                defaultSort={{ columnId: 'starts_at', direction: 'asc' }}
                pageSize={25}
                emptyMessage={
                  bookings?.length
                    ? 'No bookings match this filter'
                    : 'No bookings yet. The booking page goes live once the edge functions are deployed.'
                }
                toolbar={
                  <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTERS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <BookingAvailabilityEditor />
        </TabsContent>
      </Tabs>

      <Dialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {cancelling?.guest_name} on{' '}
                  {cancelling ? inLondon(cancelling.starts_at) : ''}.
                </p>
                <p>
                  The slot becomes bookable again straight away. The guest is not emailed, and the
                  Zoom meeting and calendar event are not removed - do those by hand until the edge
                  functions are deployed.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={cancelBooking.isPending}
              onClick={() => cancelling && cancelBooking.mutate(cancelling.id)}
            >
              {cancelBooking.isPending ? 'Cancelling...' : 'Cancel booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
