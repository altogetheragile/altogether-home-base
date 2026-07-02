import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DataTable, type DataTableColumn } from '@/components/admin/DataTable';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
          // Ignored: a failed count falls back to 0 below; not worth failing the list.
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

  const columns: DataTableColumn<InstructorWithEventCount>[] = useMemo(() => [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      sortValue: (i) => i.name,
      cellClassName: 'font-medium',
      cell: (i) => i.name,
    },
    {
      id: 'bio',
      header: 'Bio Preview',
      cellClassName: 'max-w-xs',
      cell: (i) => (
        <p className="text-sm text-muted-foreground truncate">{i.bio || 'No bio provided'}</p>
      ),
    },
    {
      id: 'image',
      header: 'Profile Image',
      cell: (i) =>
        i.profile_image_url ? (
          <img
            src={i.profile_image_url}
            alt={i.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">No Image</span>
          </div>
        ),
    },
    {
      id: 'events',
      header: 'Associated Events',
      sortable: true,
      sortValue: (i) => i.event_count,
      cell: (i) => (
        <div className="flex items-center space-x-2">
          <Badge variant={i.event_count > 0 ? 'default' : 'secondary'}>
            {i.event_count} event{i.event_count !== 1 ? 's' : ''}
          </Badge>
          {i.event_count > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This instructor has associated events</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (instructor) => (
        <div className="flex items-center space-x-2">
          <Link to={`/admin/instructors/${instructor.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
                  <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteInstructorMutation.mutate(instructor.id)}
                  className="bg-destructive hover:bg-destructive"
                  disabled={deleteInstructorMutation.isPending}
                >
                  {deleteInstructorMutation.isPending ? 'Deleting...' : 'Delete Instructor'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteInstructorMutation.isPending]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instructors</h1>
            <p className="text-muted-foreground">Manage instructors and their details</p>
          </div>
          <Link to="/admin/instructors/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Instructor</span>
            </Button>
          </Link>
        </div>

        <DataTable
          data={instructors}
          columns={columns}
          rowKey={(i) => i.id}
          isLoading={isLoading}
          searchable
          searchPlaceholder="Search instructors..."
          getSearchText={(i) => `${i.name} ${i.bio ?? ''}`}
          emptyMessage={
            <>
              No instructors found.{' '}
              <Link to="/admin/instructors/new" className="text-primary hover:underline">
                Add your first instructor
              </Link>
            </>
          }
        />
      </div>
    </TooltipProvider>
  );
};

export default AdminInstructors;
