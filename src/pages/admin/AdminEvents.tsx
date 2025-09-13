import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
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
import { useLocation } from 'react-router-dom';

const AdminEvents = () => {
  const location = useLocation();
  
  // Only run queries when actually on the events route
  const shouldFetch = location.pathname.startsWith('/admin/events');
  
  // Debug logging
  console.log('🔍 AdminEvents: Component render', {
    pathname: location.pathname,
    shouldFetch,
    timestamp: new Date().toISOString()
  });
  
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      console.log('🚀 AdminEvents: Starting fetch...', {
        pathname: location.pathname,
        shouldFetch,
        timestamp: new Date().toISOString()
      });
      
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔐 AdminEvents: Current session:', {
        hasSession: !!sessionData.session,
        hasAccessToken: !!sessionData.session?.access_token,
        userEmail: sessionData.session?.user?.email || 'none',
        hasUserId: !!sessionData.session?.user?.id
      });

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

      console.log('📊 AdminEvents: Query result:', {
        dataCount: data?.length || 0,
        hasError: !!error,
        errorMessage: error?.message || null,
        hasData: !!data,
        firstEventTitle: data?.[0]?.title || 'none'
      });

      if (error) {
        console.error('❌ AdminEvents: Database error:', error);
        throw error;
      }
      return data || [];
    },
    enabled: shouldFetch, // Only run when on the correct route
  });

  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [registrationsEvent, setRegistrationsEvent] = useState<{ id: string; title: string } | null>(null);
  const { deleteEvent } = useEventMutations();

  // Add early return after all hooks to prevent rendering on non-events routes
  if (!shouldFetch) {
    return null;
  }

  const handleDelete = async () => {
    if (!deleteEventId) return;

    try {
      await deleteEvent.mutateAsync(deleteEventId);
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });
      setDeleteEventId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const getRegistrationBadge = (registrations: any[]) => {
    if (!Array.isArray(registrations)) return null;
    
    const paidCount = registrations.filter(r => r.payment_status === 'paid').length;
    const totalCount = registrations.length;
    
    if (totalCount === 0) {
      return <Badge variant="secondary">No registrations</Badge>;
    }
    
    return (
      <Badge variant={paidCount > 0 ? 'default' : 'secondary'}>
        {paidCount}/{totalCount} paid
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading events</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        <Link to="/admin/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
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
              const eventId = String(event.id || '');
              const title = String(event.title || 'Untitled');
              const instructorName = String(event.instructor?.name || 'TBA');
              const locationName = String(event.location?.name || 'TBA');
              const priceCents = Number(event.price_cents) || 0;
              const currency = String(event.currency || 'usd');
              const registrations = Array.isArray(event.event_registrations) ? event.event_registrations : [];
              const isPublished = Boolean(event.is_published);
              
              let formattedDate = '—';
              if (event.start_date) {
                try {
                  const date = new Date(event.start_date);
                  if (!isNaN(date.getTime())) {
                    formattedDate = format(date, 'MMM dd, yyyy');
                  }
                } catch (e) {
                  // Keep default '—'
                }
              }

              return (
                <TableRow key={eventId}>
                  <TableCell className="font-medium">{title}</TableCell>
                  <TableCell>{formattedDate}</TableCell>
                  <TableCell>{instructorName}</TableCell>
                  <TableCell>{locationName}</TableCell>
                  <TableCell>
                    {priceCents > 0 ? formatPrice(priceCents, currency) : 'Free'}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {getRegistrationBadge(registrations)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {registrations.length > 0 
                              ? 'Cannot delete events with registrations'
                              : 'No registrations - safe to delete'
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isPublished ? 'default' : 'secondary'}>
                      {isPublished ? (
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
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteEventId(eventId)}
                        disabled={registrations.length > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }) : null}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => {
        if (!open) setDeleteEventId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventRegistrationsDialog
        open={!!registrationsEvent}
        onOpenChange={(open) => {
          if (!open) setRegistrationsEvent(null);
        }}
        eventId={registrationsEvent?.id}
        eventTitle={registrationsEvent?.title}
      />
    </div>
  );
};

export default AdminEvents;
