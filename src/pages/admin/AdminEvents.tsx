import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEventMutations } from '@/hooks/useEventMutations';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EventRegistrationsDialog from '@/components/admin/events/EventRegistrationsDialog';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/currency';

// Helper functions for safe rendering
const normalizeBool = (v: any): boolean => {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return Boolean((v as any)?.value ?? v);
};

const formatDateSafe = (value: any): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return format(d, 'MMM dd, yyyy');
  }
  return '—';
};

const AdminEvents = () => {
  const location = useLocation();
  
  // Compute route check at the top
  const isEventsRoute = location.pathname.startsWith('/admin/events');

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['admin-events'],
    enabled: isEventsRoute, // Only run when on the correct route
    queryFn: async () => {
      console.log('🔍 AdminEvents: Starting fetch...');
      
      // Check current session first
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔐 AdminEvents: Current session:', 'Session status: ' + (!!sessionData.session ? 'Active' : 'None'));

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          instructor:instructors(name),
          location:locations(name),
          event_registrations(
            id,
            payment_status
          )
        `)
        .order('start_date', { ascending: false });

      console.log('📊 AdminEvents: Query result:', 'Found ' + (data?.length || 0) + ' events, Error: ' + (error?.message || 'None'));

      if (error) {
        console.error('❌ AdminEvents: Database error:', error);
        throw error;
      }
      return data || [];
    },
  });

  const { deleteEvent } = useEventMutations();
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [registrationsEvent, setRegistrationsEvent] = useState<{ id: string; title: string } | null>(null);

  const getRegistrationBadge = (registrations: unknown) => {
    if (!Array.isArray(registrations)) return null;
    
    const totalCount = registrations.length;
    const paidCount = registrations.filter(r => r.payment_status === 'paid').length;
    
    let variant: "default" | "secondary" | "destructive" = "secondary";
    let className = "";
    
    if (totalCount === 0) {
      variant = "secondary";
      className = "bg-gray-100 text-gray-600";
    } else if (totalCount >= 16) {
      variant = "default";
      className = "bg-green-100 text-green-700";
    } else if (totalCount >= 6) {
      variant = "default";
      className = "bg-blue-100 text-blue-700";
    } else {
      variant = "default";
      className = "bg-yellow-100 text-yellow-700";
    }

    return (
      <div className="flex flex-col items-center space-y-1">
        <Badge variant={variant} className={className}>
          {String(totalCount)} registered
        </Badge>
        {totalCount > 0 && (
          <span className="text-xs text-gray-500">
            {String(paidCount)} paid
          </span>
        )}
      </div>
    );
  };

  // Early return after all hooks to prevent fetches on non-events routes
  if (!isEventsRoute) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Events</h2>
          <p className="text-gray-600">View and manage all events</p>
        </div>
        <Link to="/admin/events/new">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(events) ? events.map((event) => {
              // Safely normalize all values
              const published = normalizeBool(event.is_published);
              const title = String(event.title ?? 'Untitled');
              const instructorName = String(event.instructor?.name ?? 'TBA');
              const locationName = String(event.location?.name ?? 'TBA');
              const priceCents = Number(event.price_cents) || 0;
              const currency = String(event.currency || 'usd');
              const registrations = event.event_registrations ?? [];
              const eventId = String(event.id);

              return (
                <TableRow key={eventId}>
                  <TableCell className="font-medium">{title}</TableCell>
                  <TableCell>{formatDateSafe(event.start_date)}</TableCell>
                  <TableCell>{instructorName}</TableCell>
                  <TableCell>{locationName}</TableCell>
                  <TableCell>
                    {formatPrice(priceCents, currency)}
                  </TableCell>
                  <TableCell>
                    {getRegistrationBadge(registrations)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={published ? 'default' : 'secondary'}>
                      {published ? (
                        <><Eye className="h-3 w-3 mr-1" />Published</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" />Draft</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link to={`/admin/events/${eventId}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRegistrationsEvent({ id: eventId, title })}
                      >
                        Manage Registrations
                      </Button>

                      {Array.isArray(registrations) && registrations.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button variant="destructive" size="sm" disabled aria-disabled="true">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cannot delete event with registrations</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setEventToDelete({ id: eventId, title })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : null}
            {!Array.isArray(events) || events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No events found. <Link to="/admin/events/new" className="text-primary hover:underline">Create your first event</Link>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{String(eventToDelete?.title || 'this event')}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!eventToDelete?.id) return;
                try {
                  await deleteEvent.mutateAsync(eventToDelete.id);
                } finally {
                  setEventToDelete(null);
                }
              }}
              disabled={deleteEvent.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventRegistrationsDialog
        open={!!registrationsEvent}
        onOpenChange={(open) => !open && setRegistrationsEvent(null)}
        eventId={String(registrationsEvent?.id || '')}
        eventTitle={String(registrationsEvent?.title || 'Event')}
      />
    </div>
  );
};

export default AdminEvents;