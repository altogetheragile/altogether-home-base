import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { useExams } from '@/hooks/useExams';
import { useCreateExam, useUpdateExam, useDeleteExam } from '@/hooks/useExamMutations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import SimpleForm from '@/components/admin/SimpleForm';
import type { Exam } from '@/hooks/useExams';

const examFields = [
  { key: 'title', label: 'Title', type: 'text' as const, required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number' as const, required: true, placeholder: '40' },
  { key: 'pass_mark', label: 'Pass Mark', type: 'number' as const, required: true, placeholder: '30' },
  { key: 'total_questions', label: 'Total Questions', type: 'number' as const, required: true, placeholder: '50' },
  {
    key: 'status', label: 'Status', type: 'select' as const, required: true,
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
    ],
  },
];

const AdminExams = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const { data: exams, isLoading, error } = useExams();
  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();
  const deleteMutation = useDeleteExam();

  const handleCreate = async (data: Record<string, unknown>) => {
    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(
        {
          title: data.title as string,
          description: (data.description as string) || undefined,
          duration_minutes: Number(data.duration_minutes) || 40,
          pass_mark: Number(data.pass_mark) || 30,
          total_questions: Number(data.total_questions) || 50,
          status: (data.status as string) || 'draft',
        },
        { onSuccess: () => { setIsCreateOpen(false); resolve(); }, onError: reject },
      );
    });
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editingExam) return;
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        {
          id: editingExam.id,
          data: {
            title: data.title as string,
            description: (data.description as string) || undefined,
            duration_minutes: Number(data.duration_minutes) || 40,
            pass_mark: Number(data.pass_mark) || 30,
            total_questions: Number(data.total_questions) || 50,
            status: (data.status as string) || 'draft',
          },
        },
        { onSuccess: () => { setEditingExam(null); resolve(); }, onError: reject },
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error loading exams: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600">Manage exams and their question banks</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Exam</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
            <SimpleForm
              title="Exam"
              onSubmit={handleCreate}
              onCancel={() => setIsCreateOpen(false)}
              fields={examFields}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All Exams</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead className="text-center">Pass Mark</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams?.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <Link
                      to={`/admin/exams/${exam.id}/questions`}
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {exam.title}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">{exam.question_count ?? 0}</TableCell>
                  <TableCell className="text-center">{exam.pass_mark}</TableCell>
                  <TableCell className="text-center">{exam.duration_minutes} min</TableCell>
                  <TableCell>
                    <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                      {exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingExam?.id === exam.id}
                        onOpenChange={(open) => { if (!open) setEditingExam(null); }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingExam(exam)}>
                            <Edit className="h-4 w-4" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>Edit Exam</DialogTitle></DialogHeader>
                          <SimpleForm
                            title="Exam"
                            onSubmit={handleEdit}
                            editingItem={exam}
                            onCancel={() => setEditingExam(null)}
                            fields={examFields}
                          />
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{exam.title}&quot; and all its questions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(exam.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            </TableBody>
          </Table>
          {exams?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No exams yet. Create your first exam above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExams;
