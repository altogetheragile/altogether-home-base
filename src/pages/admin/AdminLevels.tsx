import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useLevels } from '@/hooks/useLevels';
import { useCreateLevel, useUpdateLevel, useDeleteLevel } from '@/hooks/useLevelMutations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import SimpleForm from '@/components/admin/SimpleForm';

type Level = {
  id: string;
  name: string;
};

const AdminLevels = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  
  const { data: levels, isLoading, error } = useLevels();
  const createMutation = useCreateLevel();
  const updateMutation = useUpdateLevel();
  const deleteMutation = useDeleteLevel();

  const handleCreate = (data: { name: string }) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      },
    });
  };

  const handleEdit = (data: { name: string }) => {
    if (editingLevel) {
      updateMutation.mutate(
        { id: editingLevel.id, data },
        {
          onSuccess: () => {
            setEditingLevel(null);
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading levels: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Levels</h1>
          <p className="text-gray-600">Manage skill/difficulty levels</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Level
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Level</DialogTitle>
            </DialogHeader>
            <SimpleForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels?.map((level) => (
                <TableRow key={level.id}>
                  <TableCell>{level.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingLevel?.id === level.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingLevel(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingLevel(level)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Level</DialogTitle>
                          </DialogHeader>
                          <SimpleForm
                            initialData={{ name: level.name }}
                            onSubmit={handleEdit}
                            isLoading={updateMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the level "{level.name}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(level.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {levels?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No levels found. Create your first level above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLevels;