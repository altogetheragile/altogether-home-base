import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Weekly hours and date overrides, per booking type.
 *
 * Writes straight to booking_availability and booking_overrides under the admin
 * RLS policies, so it needs no edge function and no secrets.
 *
 * Times are the booking type's local time, which the type carries in its
 * `timezone` column. The slot builder reads these rows and converts; nothing
 * here does time maths.
 */

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

type BookingType = {
  id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  buffer_before: number;
  buffer_after: number;
  min_notice_minutes: number;
  max_days_ahead: number;
  timezone: string;
  active: boolean;
};

type Window = {
  id: string;
  booking_type_id: string;
  weekday: number;
  start_local: string;
  end_local: string;
};

type Override = {
  id: string;
  booking_type_id: string;
  on_date: string;
  closed: boolean;
  start_local: string | null;
  end_local: string | null;
  note: string | null;
};

/** Postgres hands back 'HH:MM:SS'; the time input wants 'HH:MM'. */
const toInputTime = (value: string) => value.slice(0, 5);

export const BookingAvailabilityEditor = () => {
  const queryClient = useQueryClient();
  const [typeId, setTypeId] = useState<string | null>(null);

  const [newDay, setNewDay] = useState('1');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('17:00');

  const [overrideDate, setOverrideDate] = useState('');
  const [overrideClosed, setOverrideClosed] = useState(true);
  const [overrideStart, setOverrideStart] = useState('09:00');
  const [overrideEnd, setOverrideEnd] = useState('17:00');
  const [overrideNote, setOverrideNote] = useState('');

  const { data: types, isLoading: typesLoading } = useQuery({
    queryKey: ['admin-booking-types'],
    queryFn: async (): Promise<BookingType[]> => {
      const { data, error } = await supabase
        .from('booking_types')
        .select('id, slug, name, duration_minutes, buffer_before, buffer_after, min_notice_minutes, max_days_ahead, timezone, active')
        .order('name');
      if (error) throw error;
      return (data ?? []) as BookingType[];
    },
  });

  const selected = types?.find((t) => t.id === typeId) ?? types?.[0] ?? null;
  const selectedId = selected?.id ?? null;

  const { data: windows } = useQuery({
    queryKey: ['admin-booking-availability', selectedId],
    enabled: !!selectedId,
    queryFn: async (): Promise<Window[]> => {
      const { data, error } = await supabase
        .from('booking_availability')
        .select('id, booking_type_id, weekday, start_local, end_local')
        .eq('booking_type_id', selectedId!)
        .order('weekday')
        .order('start_local');
      if (error) throw error;
      return (data ?? []) as Window[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ['admin-booking-overrides', selectedId],
    enabled: !!selectedId,
    queryFn: async (): Promise<Override[]> => {
      const { data, error } = await supabase
        .from('booking_overrides')
        .select('id, booking_type_id, on_date, closed, start_local, end_local, note')
        .eq('booking_type_id', selectedId!)
        .order('on_date');
      if (error) throw error;
      return (data ?? []) as Override[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-booking-availability', selectedId] });
    queryClient.invalidateQueries({ queryKey: ['admin-booking-overrides', selectedId] });
  };

  const addWindow = useMutation({
    mutationFn: async () => {
      if (newEnd <= newStart) throw new Error('The end time must be after the start time.');
      const { error } = await supabase.from('booking_availability').insert({
        booking_type_id: selectedId!,
        weekday: Number(newDay),
        start_local: newStart,
        end_local: newEnd,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Window added');
    },
    onError: (e: Error) => toast.error('Could not add the window', { description: e.message }),
  });

  const removeWindow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('booking_availability').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Window removed');
    },
    onError: (e: Error) => toast.error('Could not remove the window', { description: e.message }),
  });

  const addOverride = useMutation({
    mutationFn: async () => {
      if (!overrideDate) throw new Error('Pick a date.');
      if (!overrideClosed && overrideEnd <= overrideStart) {
        throw new Error('The end time must be after the start time.');
      }
      const { error } = await supabase.from('booking_overrides').insert({
        booking_type_id: selectedId!,
        on_date: overrideDate,
        closed: overrideClosed,
        // The migration's check constraint wants these null on a closed day.
        start_local: overrideClosed ? null : overrideStart,
        end_local: overrideClosed ? null : overrideEnd,
        note: overrideNote || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setOverrideDate('');
      setOverrideNote('');
      toast.success('Override saved');
    },
    onError: (e: Error) =>
      toast.error('Could not save the override', {
        // The unique key per date is the likeliest failure, so name it.
        description: e.message.includes('duplicate key')
          ? 'There is already an override for that date. Remove it first.'
          : e.message,
      }),
  });

  const removeOverride = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('booking_overrides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Override removed');
    },
    onError: (e: Error) => toast.error('Could not remove the override', { description: e.message }),
  });

  if (typesLoading) {
    return <div className="text-muted-foreground">Loading booking types...</div>;
  }

  if (!selected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No booking types</CardTitle>
          <CardDescription>
            The migration seeds a Chemistry Session. If nothing is listed here, it has not run
            against this database yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {types && types.length > 1 && (
        <Select value={selected.id} onValueChange={setTypeId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{selected.name}</CardTitle>
          <CardDescription>
            {selected.duration_minutes} minutes, {selected.buffer_after} minutes buffer after,{' '}
            {Math.round(selected.min_notice_minutes / 60)} hours notice, {selected.max_days_ahead}{' '}
            days ahead. Times below are {selected.timezone}.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly hours</CardTitle>
          <CardDescription>
            The normal working week. A date override replaces these for that one day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(windows ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No weekly hours set, so nothing can be booked.
            </p>
          )}

          <ul className="space-y-2">
            {(windows ?? []).map((w) => (
              <li key={w.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <span className="w-28 font-medium">
                  {DAYS.find((d) => d.value === w.weekday)?.label ?? w.weekday}
                </span>
                <span className="text-muted-foreground">
                  {toInputTime(w.start_local)} to {toInputTime(w.end_local)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => removeWindow.mutate(w.id)}
                  aria-label={`Remove ${DAYS.find((d) => d.value === w.weekday)?.label} window`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <div>
              <Label htmlFor="new-day">Day</Label>
              <Select value={newDay} onValueChange={setNewDay}>
                <SelectTrigger id="new-day" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-start">From</Label>
              <Input
                id="new-start"
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="w-[120px]"
              />
            </div>
            <div>
              <Label htmlFor="new-end">To</Label>
              <Input
                id="new-end"
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="w-[120px]"
              />
            </div>
            <Button onClick={() => addWindow.mutate()} disabled={addWindow.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Add window
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date overrides</CardTitle>
          <CardDescription>
            Bank holidays, days off, or one-off extra hours. One per date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(overrides ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No overrides.</p>
          )}

          <ul className="space-y-2">
            {(overrides ?? []).map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <span className="w-28 font-medium">{o.on_date}</span>
                {o.closed ? (
                  <Badge variant="outline">Closed</Badge>
                ) : (
                  <span className="text-muted-foreground">
                    {toInputTime(o.start_local ?? '')} to {toInputTime(o.end_local ?? '')}
                  </span>
                )}
                {o.note && <span className="text-sm text-muted-foreground">{o.note}</span>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => removeOverride.mutate(o.id)}
                  aria-label={`Remove override for ${o.on_date}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <div>
              <Label htmlFor="override-date">Date</Label>
              <Input
                id="override-date"
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="w-[170px]"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="override-closed"
                checked={overrideClosed}
                onCheckedChange={(v) => setOverrideClosed(v === true)}
              />
              <Label htmlFor="override-closed" className="cursor-pointer">
                Closed all day
              </Label>
            </div>

            {!overrideClosed && (
              <>
                <div>
                  <Label htmlFor="override-start">From</Label>
                  <Input
                    id="override-start"
                    type="time"
                    value={overrideStart}
                    onChange={(e) => setOverrideStart(e.target.value)}
                    className="w-[120px]"
                  />
                </div>
                <div>
                  <Label htmlFor="override-end">To</Label>
                  <Input
                    id="override-end"
                    type="time"
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                    className="w-[120px]"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="override-note">Note</Label>
              <Input
                id="override-note"
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Bank holiday"
                className="w-[200px]"
              />
            </div>

            <Button onClick={() => addOverride.mutate()} disabled={addOverride.isPending}>
              <Plus className="mr-1 h-4 w-4" /> Add override
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
