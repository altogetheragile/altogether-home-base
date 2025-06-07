
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

const AdminInstructors = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: instructors, isLoading } = useQuery({
    queryKey: ['admin-instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      toast({
        title: 'Success',
        description: 'Instructor deleted successfully',
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
                          <AlertDialogDescription>
                            Are you sure you want to delete {instructor.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteInstructorMutation.mutate(instructor.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
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
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
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
