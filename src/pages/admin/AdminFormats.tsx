import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useFormats } from '@/hooks/useFormats';
import { useCreateFormat, useUpdateFormat, useDeleteFormat } from '@/hooks/useFormatMutations';
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

type Format = {
  id: string;
  name: string;
};

const AdminFormats = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<Format | null>(null);
  
  const { data: formats, isLoading, error } = useFormats();
  const createMutation = useCreateFormat();
  const updateMutation = useUpdateFormat();
  const deleteMutation = useDeleteFormat();

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
    if (editingFormat) {
      return new Promise<void>((resolve, reject) => {
        updateMutation.mutate(
          { id: editingFormat.id, data },
          {
            onSuccess: () => {
              setEditingFormat(null);
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
        Error loading formats: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formats</h1>
          <p className="text-gray-600">Manage event formats (online, in-person, hybrid)</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Format
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Format</DialogTitle>
            </DialogHeader>
            <SimpleForm
              title="Format"
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
          <CardTitle>All Formats</CardTitle>
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
              {formats?.map((format) => (
                <TableRow key={format.id}>
                  <TableCell>{format.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingFormat?.id === format.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingFormat(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFormat(format)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Format</DialogTitle>
                          </DialogHeader>
                          <SimpleForm
                            title="Format"
                            onSubmit={handleEdit}
                            editingItem={format}
                            onCancel={() => setEditingFormat(null)}
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
                              This will permanently delete the format "{format.name}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(format.id)}
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
          {formats?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No formats found. Create your first format above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFormats;