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

const AdminEvents = () => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      console.log('🔍 AdminEvents: Starting fetch...');
      
      // Check current session first
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
  });

  const { deleteEvent } = useEventMutations();
  const [eventToDelete, setEventToDelete] = useState<any | null>(null);
  const [registrationsEvent, setRegistrationsEvent] = useState<any | null>(null);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  const getRegistrationBadge = (registrations: any[]) => {
    if (!registrations) return null;
    
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
          {totalCount} registered
        </Badge>
        {totalCount > 0 && (
          <span className="text-xs text-gray-500">
            {paidCount} paid
          </span>
        )}
      </div>
    );
  };

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
            {events?.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{formatDate(event.start_date)}</TableCell>
                <TableCell>{event.instructor?.name || 'TBA'}</TableCell>
                <TableCell>{event.location?.name || 'TBA'}</TableCell>
                <TableCell>
                  {formatPrice(event.price_cents || 0, event.currency || 'usd')}
                </TableCell>
                <TableCell>
                  {getRegistrationBadge(event.event_registrations)}
                </TableCell>
                <TableCell>
                  <Badge variant={event.is_published ? 'default' : 'secondary'}>
                    {event.is_published ? (
                      <><Eye className="h-3 w-3 mr-1" />Published</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" />Draft</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link to={`/admin/events/${event.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRegistrationsEvent(event)}
                    >
                      Manage Registrations
                    </Button>

                    {event?.event_registrations?.length > 0 ? (
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
                        onClick={() => {
                          setEventToDelete(event);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!events?.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No events found. <Link to="/admin/events/new" className="text-primary hover:underline">Create your first event</Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
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
        eventId={registrationsEvent?.id}
        eventTitle={registrationsEvent?.title}
      />
    </div>
  );
};

export default AdminEvents;
