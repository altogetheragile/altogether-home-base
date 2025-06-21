
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface InstructorWithEventCount {
  id: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  event_count: number;
}

const AdminInstructors = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: instructors, isLoading } = useQuery({
    queryKey: ['admin-instructors'],
    queryFn: async () => {
      // First get all instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructors')
        .select('*')
        .order('name');

      if (instructorsError) throw instructorsError;

      // Then get event counts for each instructor
      const instructorsWithCounts: InstructorWithEventCount[] = [];
      
      for (const instructor of instructorsData || []) {
        const { count, error: countError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('instructor_id', instructor.id);

        if (countError) {
          console.error('Error counting events for instructor:', instructor.id, countError);
        }

        instructorsWithCounts.push({
          ...instructor,
          event_count: count || 0,
        });
      }

      return instructorsWithCounts;
    },
  });

  const deleteInstructorMutation = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .delete()
        .eq('id', instructorId);
      
      if (error) throw error;
    },
    onSuccess: (_, instructorId) => {
      const instructor = instructors?.find(i => i.id === instructorId);
      const eventCount = instructor?.event_count || 0;
      
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      toast({
        title: 'Success',
        description: eventCount > 0 
          ? `Instructor deleted successfully. ${eventCount} event(s) are now unassigned.`
          : 'Instructor deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete instructor',
        variant: 'destructive',
      });
    },
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-600">Manage instructors and their details</p>
        </div>
        <Link to="/admin/instructors/new">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Instructor</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Bio Preview</TableHead>
              <TableHead>Profile Image</TableHead>
              <TableHead>Associated Events</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructors?.map((instructor) => (
              <TableRow key={instructor.id}>
                <TableCell className="font-medium">{instructor.name}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm text-gray-600 truncate">
                    {instructor.bio || 'No bio provided'}
                  </p>
                </TableCell>
                <TableCell>
                  {instructor.profile_image_url ? (
                    <img 
                      src={instructor.profile_image_url} 
                      alt={instructor.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant={instructor.event_count > 0 ? "default" : "secondary"}>
                      {instructor.event_count} event{instructor.event_count !== 1 ? 's' : ''}
                    </Badge>
                    {instructor.event_count > 0 && (
                      <AlertCircle className="h-4 w-4 text-amber-500" title="This instructor has associated events" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link to={`/admin/instructors/${instructor.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>Are you sure you want to delete <strong>{instructor.name}</strong>?</p>
                            {instructor.event_count > 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                                <div className="flex items-center space-x-2">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  <span className="text-sm font-medium text-amber-800">
                                    Impact on Events
                                  </span>
                                </div>
                                <p className="text-sm text-amber-700 mt-1">
                                  This instructor is currently assigned to <strong>{instructor.event_count}</strong> event{instructor.event_count !== 1 ? 's' : ''}. 
                                  These events will become unassigned but will remain in the system.
                                </p>
                              </div>
                            )}
                            <p className="text-sm text-gray-600">This action cannot be undone.</p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteInstructorMutation.mutate(instructor.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteInstructorMutation.isPending}
                          >
                            {deleteInstructorMutation.isPending ? 'Deleting...' : 'Delete Instructor'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!instructors?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No instructors found. <Link to="/admin/instructors/new" className="text-primary hover:underline">Add your first instructor</Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminInstructors;
