import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useCreateEventType, useUpdateEventType, useDeleteEventType } from '@/hooks/useEventTypeMutations';
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

type EventType = {
  id: string;
  name: string;
};

const AdminEventTypes = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  
  const { data: eventTypes, isLoading, error } = useEventTypes();
  const createMutation = useCreateEventType();
  const updateMutation = useUpdateEventType();
  const deleteMutation = useDeleteEventType();

  const handleCreate = (data: { name: string }) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      },
    });
  };

  const handleEdit = (data: { name: string }) => {
    if (editingEventType) {
      updateMutation.mutate(
        { id: editingEventType.id, data },
        {
          onSuccess: () => {
            setEditingEventType(null);
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
        Error loading event types: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Types</h1>
          <p className="text-gray-600">Manage event type categories</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event Type</DialogTitle>
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
          <CardTitle>All Event Types</CardTitle>
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
              {eventTypes?.map((eventType) => (
                <TableRow key={eventType.id}>
                  <TableCell>{eventType.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingEventType?.id === eventType.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingEventType(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingEventType(eventType)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Event Type</DialogTitle>
                          </DialogHeader>
                          <SimpleForm
                            initialData={{ name: eventType.name }}
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
                              This will permanently delete the event type "{eventType.name}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(eventType.id)}
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
          {eventTypes?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No event types found. Create your first event type above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEventTypes;