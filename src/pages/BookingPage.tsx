import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, Video, AlertTriangle, Check } from 'lucide-react';

/**
 * Public booking page, /book/:slug.
 *
 * The booking type comes straight from Postgres under the "public read active
 * booking types" policy. Slots come from the booking-slots edge function, which
 * is not deployed yet - it needs the Zoom and Google secrets - so the slot
 * column shows an honest unavailable state rather than an empty calendar that
 * looks like a fully booked diary.
 *
 * Every instant crossing the wire is UTC. This page only formats.
 */

type BookingType = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  video_provider: string;
  price_pence: number;
};

type Slot = { startsAt: string; endsAt: string };

/** The visitor's own zone, which is what every time on this page is shown in. */
const guestTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const timeIn = (iso: string, tz: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));

const dateIn = (iso: string, tz: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));

/** 'YYYY-MM-DD' for a Date, read in the given zone rather than the machine's. */
const isoDateIn = (date: Date, tz: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
  return parts; // en-CA gives YYYY-MM-DD
};

const BookingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const tz = useMemo(() => guestTimezone(), []);

  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  // Bots fill every field they find. A real person never sees this one.
  const [honeypot, setHoneypot] = useState('');

  const { data: type, isLoading: typeLoading, error: typeError } = useQuery({
    queryKey: ['booking-type', slug],
    enabled: !!slug,
    queryFn: async (): Promise<BookingType | null> => {
      const { data, error } = await supabase
        .from('booking_types')
        .select('id, slug, name, description, duration_minutes, video_provider, price_pence')
        .eq('slug', slug!)
        .eq('active', true)
        .maybeSingle();
      if (error) throw error;
      return (data as BookingType) ?? null;
    },
  });

  // A month either side of today is enough to fill the picker.
  const range = useMemo(() => {
    const now = new Date();
    const from = isoDateIn(now, tz);
    const to = isoDateIn(new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), tz);
    return { from, to };
  }, [tz]);

  const {
    data: slots, isLoading: slotsLoading, error: slotsError,
  } = useQuery({
    queryKey: ['booking-slots', slug, range.from, range.to],
    enabled: !!type,
    retry: false,
    queryFn: async (): Promise<Slot[]> => {
      const { data, error } = await supabase.functions.invoke('booking-slots', {
        body: { type: slug, from: range.from, to: range.to },
      });
      if (error) throw error;
      return (data?.slots ?? []) as Slot[];
    },
  });

  /** Slots grouped by the calendar day they fall on in the visitor's zone. */
  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots ?? []) {
      const key = isoDateIn(new Date(slot.startsAt), tz);
      const list = map.get(key);
      if (list) list.push(slot);
      else map.set(key, [slot]);
    }
    return map;
  }, [slots, tz]);

  const daySlots = selectedDay ? byDay.get(isoDateIn(selectedDay, tz)) ?? [] : [];

  const bookingUnavailable = !!slotsError;

  if (typeLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-12">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-4 w-96" />
          <Skeleton className="mt-8 h-72 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (typeError || !type) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold">Nothing to book here</h1>
            <p className="text-muted-foreground">
              This booking link is not active. Try the contact page instead.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,18rem)]">
          {/* Left: what is being booked */}
          <section>
            <h1 className="text-3xl font-bold">{type.name}</h1>
            <ul className="mt-4 space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> {type.duration_minutes} minutes
              </li>
              <li className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                {type.video_provider === 'zoom' ? 'Video call via Zoom' : 'Video call'}
              </li>
              <li className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {type.price_pence === 0 ? 'Free' : `£${(type.price_pence / 100).toFixed(2)}`}
              </li>
            </ul>
            {type.description && <p className="mt-6 max-w-prose">{type.description}</p>}
          </section>

          {/* Middle: pick a day */}
          <section>
            {bookingUnavailable ? null : (
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(day) => {
                  setSelectedDay(day);
                  setSelectedSlot(null);
                }}
                // A day is offerable only if the server returned a slot on it,
                // which already rules out the past, the notice period, the
                // horizon and anything busy. No date maths repeated here.
                disabled={(day) => !byDay.has(isoDateIn(day, tz))}
                startMonth={new Date()}
              />
            )}
          </section>

          {/* Right: pick a time */}
          <section>
            {bookingUnavailable ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Online booking is not switched on yet. Please use the{' '}
                  <a href="/contact" className="underline">contact form</a> and we will find a time.
                </AlertDescription>
              </Alert>
            ) : slotsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !selectedDay ? (
              <p className="text-muted-foreground">Pick a day to see the times available.</p>
            ) : daySlots.length === 0 ? (
              <p className="text-muted-foreground">Nothing free that day.</p>
            ) : (
              <>
                <div className="mb-3 space-y-1">
                  <p className="font-medium">{dateIn(daySlots[0].startsAt, tz)}</p>
                  <p className="text-xs text-muted-foreground">Times shown in {tz}</p>
                </div>
                <ul className="grid gap-2">
                  {daySlots.map((slot) => (
                    <li key={slot.startsAt}>
                      <Button
                        type="button"
                        variant={selectedSlot?.startsAt === slot.startsAt ? 'default' : 'outline'}
                        className="w-full justify-center"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {timeIn(slot.startsAt, tz)}
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        {/* The form appears once a time is chosen, so the page stays one decision at a time. */}
        {selectedSlot && (
          <Card className="mt-10">
            <CardContent className="pt-6">
              <p className="mb-4 flex items-center gap-2 font-medium">
                <Check className="h-4 w-4" />
                {dateIn(selectedSlot.startsAt, tz)} at {timeIn(selectedSlot.startsAt, tz)}
                <span className="text-sm font-normal text-muted-foreground">({tz})</span>
              </p>

              <form
                className="grid max-w-xl gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // booking-create is not deployed, so there is nothing to post
                  // to yet. Wiring this up is the next commit, once the Zoom and
                  // Google secrets exist.
                }}
              >
                <div>
                  <Label htmlFor="booking-name">Your name</Label>
                  <Input
                    id="booking-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="booking-email">Email</Label>
                  <Input
                    id="booking-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="booking-notes">What would you like to talk about?</Label>
                  <Textarea
                    id="booking-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Honeypot: hidden from people, irresistible to bots. */}
                <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="booking-company">Company</label>
                  <input
                    id="booking-company"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Booking cannot be completed yet. The confirmation step goes live with the
                    booking-create edge function.
                  </AlertDescription>
                </Alert>

                <Button type="submit" disabled className="justify-self-start">
                  Confirm booking
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;
