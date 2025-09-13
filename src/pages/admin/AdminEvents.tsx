// src/pages/admin/AdminEvents.tsx - Corrected Version

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEventMutations } from '@/hooks/useEventMutations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, EyeOff, Edit, Trash2, Users, Calendar, MapPin, DollarSign } from 'lucide-react';
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
    queryFn: async () => {
      console.log('�� AdminEvents: Starting fetch...');
      
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
    enabled: isEventsRoute, // Only run when on the correct route
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
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mr-4"></div>
          <div className="text-muted-foreground">Loading events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Events</CardTitle>
            <CardDescription>
              There was a problem loading the events. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {String(error)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">
            Manage your events, registrations, and schedules
          </p>
        </div>
        <Link to="/admin/events/new">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
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

              return (
                <TableRow key={String(event.id)}>
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
                      <Link to={`/admin/events/${String(event.id)}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRegistrationsEvent({ 
                          id: String(event.id), 
                          title: title 
                        })}
                      >
                        <Users className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEventToDelete({ 
                          id: String(event.id), 
                          title: title 
                        })}
                        disabled={Array.isArray(event.event_registrations) && event.event_registrations.length > 0}
                        title={
                          Array.isArray(event.event_registrations) && event.event_registrations.length > 0
                            ? "Cannot delete events with registrations"
                            : "Delete event"
                        }
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

      {/* Event Registrations Dialog - Fixed props */}
      <EventRegistrationsDialog
        open={!!registrationsEvent}
        onOpenChange={(open) => {
          if (!open) setRegistrationsEvent(null);
        }}
        eventId={registrationsEvent?.id}
        eventTitle={registrationsEvent?.title}
      />

      {/* Delete Confirmation Dialog */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Event</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{eventToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEventToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await deleteEvent.mutateAsync(eventToDelete.id);
                    setEventToDelete(null);
                  } catch (error) {
                    console.error('Failed to delete event:', error);
                  }
                }}
                disabled={deleteEvent.isPending}
              >
                {deleteEvent.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
