import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useCreateEventCategory, useUpdateEventCategory, useDeleteEventCategory } from '@/hooks/useEventCategoryMutations';
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

type EventCategory = {
  id: string;
  name: string;
};

const AdminEventCategories = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  
  const { data: categories, isLoading, error } = useEventCategories();
  const createMutation = useCreateEventCategory();
  const updateMutation = useUpdateEventCategory();
  const deleteMutation = useDeleteEventCategory();

  const handleCreate = async (data: { name: string }) => {
    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          resolve();
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  };

  const handleEdit = async (data: { name: string }) => {
    if (editingCategory) {
      return new Promise<void>((resolve, reject) => {
        updateMutation.mutate(
          { id: editingCategory.id, data },
          {
            onSuccess: () => {
              setEditingCategory(null);
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });
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
        Error loading event categories: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Categories</h1>
          <p className="text-gray-600">Manage event categories</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event Category</DialogTitle>
            </DialogHeader>
            <SimpleForm
              title="Category"
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              fields={[
                { key: 'name', label: 'Name', type: 'text', required: true }
              ]}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Event Categories</CardTitle>
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
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingCategory?.id === category.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingCategory(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Event Category</DialogTitle>
                          </DialogHeader>
                          <SimpleForm
                            title="Category"
                            onSubmit={handleEdit}
                            editingItem={category}
                            onCancel={() => setEditingCategory(null)}
                            fields={[
                              { key: 'name', label: 'Name', type: 'text', required: true }
                            ]}
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
                              This will permanently delete the event category "{category.name}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(category.id)}
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
          {categories?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No event categories found. Create your first category above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEventCategories;