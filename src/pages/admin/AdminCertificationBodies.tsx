import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useCertificationBodies } from '@/hooks/useCertificationBodies';
import { useCreateCertificationBody, useUpdateCertificationBody, useDeleteCertificationBody } from '@/hooks/useCertificationBodiesMutations';
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

type CertificationBody = {
  id: string;
  name: string;
};

const AdminCertificationBodies = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CertificationBody | null>(null);

  const { data: certBodies, isLoading, error } = useCertificationBodies();
  const createMutation = useCreateCertificationBody();
  const updateMutation = useUpdateCertificationBody();
  const deleteMutation = useDeleteCertificationBody();

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
    if (editingItem) {
      return new Promise<void>((resolve, reject) => {
        updateMutation.mutate(
          { id: editingItem.id, data },
          {
            onSuccess: () => {
              setEditingItem(null);
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
        Error loading certification bodies: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certification Bodies</h1>
          <p className="text-gray-600">Manage certification bodies for courses</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Certification Body
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Certification Body</DialogTitle>
            </DialogHeader>
            <SimpleForm
              title="Certification Body"
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
          <CardTitle>All Certification Bodies</CardTitle>
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
              {certBodies?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingItem?.id === item.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingItem(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Certification Body</DialogTitle>
                          </DialogHeader>
                          <SimpleForm
                            title="Certification Body"
                            onSubmit={handleEdit}
                            editingItem={item}
                            onCancel={() => setEditingItem(null)}
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
                              This will permanently delete "{item.name}".
                              Any courses using this certification body will be unlinked.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
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
          {certBodies?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No certification bodies found. Create your first one above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCertificationBodies;
