
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { formatPrice } from '@/utils/currency';
import AdminTemplates from './AdminTemplates';
import AdminInstructors from './AdminInstructors';
import AdminLocations from './AdminLocations';
import AdminPages from './AdminPages';
import AdminEventTypes from './AdminEventTypes';
import AdminEventCategories from './AdminEventCategories';
import AdminLevels from './AdminLevels';
import AdminFormats from './AdminFormats';
import AdminKnowledgeBase from './AdminKnowledgeBase';

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
        userEmail: sessionData.session?.user?.email,
        uid: sessionData.session?.user?.id
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
        error: error?.message,
        hasData: !!data,
        firstEvent: data?.[0]?.title
      });

      if (error) {
        console.error('❌ AdminEvents: Database error:', error);
        throw error;
      }
      return data || [];
    },
  });

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
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="event-management">Event Management</TabsTrigger>
          <TabsTrigger value="content-management">Content Management</TabsTrigger>
          <TabsTrigger value="knowledge-management">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">All Events</h2>
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
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        </TabsContent>

        <TabsContent value="event-management" className="space-y-6">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="instructors">Instructors</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="event-types">Event Types</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="levels">Levels</TabsTrigger>
              <TabsTrigger value="formats">Formats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates">
              <AdminTemplates />
            </TabsContent>
            
            <TabsContent value="instructors">
              <AdminInstructors />
            </TabsContent>
            
            <TabsContent value="locations">
              <AdminLocations />
            </TabsContent>

            <TabsContent value="event-types">
              <AdminEventTypes />
            </TabsContent>

            <TabsContent value="categories">
              <AdminEventCategories />
            </TabsContent>

            <TabsContent value="levels">
              <AdminLevels />
            </TabsContent>

            <TabsContent value="formats">
              <AdminFormats />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="content-management">
          <AdminPages />
        </TabsContent>

        <TabsContent value="knowledge-management">
          <AdminKnowledgeBase />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEvents;
