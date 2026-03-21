import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Upload, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { useExam } from '@/hooks/useExams';
import { useQuestions, useQuestionAreas, type Question } from '@/hooks/useQuestions';
import {
  useCreateQuestion, useUpdateQuestion, useDeleteQuestion, useBulkImportQuestions,
} from '@/hooks/useQuestionMutations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

/* ─── Question Form Component ─── */
interface QuestionFormProps {
  examId: string;
  existingAreas: string[];
  editingQuestion?: Question | null;
  onClose: () => void;
  onSubmitCreate: (data: Record<string, unknown>) => Promise<void>;
  onSubmitEdit: (data: Record<string, unknown>) => Promise<void>;
}

const QuestionForm = ({ examId, existingAreas, editingQuestion, onClose, onSubmitCreate, onSubmitEdit }: QuestionFormProps) => {
  const [form, setForm] = useState({
    area: editingQuestion?.area || '',
    question_text: editingQuestion?.question_text || '',
    option_a: editingQuestion?.option_a || '',
    option_b: editingQuestion?.option_b || '',
    option_c: editingQuestion?.option_c || '',
    option_d: editingQuestion?.option_d || '',
    correct_answer: editingQuestion?.correct_answer || 'A',
    reference: editingQuestion?.reference || '',
    status: editingQuestion?.status || 'published',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, exam_id: examId };
      if (editingQuestion) {
        await onSubmitEdit(payload);
      } else {
        await onSubmitCreate(payload);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Area</Label>
        <Input
          list="area-list"
          value={form.area}
          onChange={(e) => update('area', e.target.value)}
          required
          placeholder="e.g. Planning, Delivery, Governance"
        />
        <datalist id="area-list">
          {existingAreas.map((a) => <option key={a} value={a} />)}
        </datalist>
      </div>

      <div>
        <Label>Question Text</Label>
        <Textarea value={form.question_text} onChange={(e) => update('question_text', e.target.value)} required rows={3} />
      </div>

      {(['A', 'B', 'C', 'D'] as const).map((letter) => (
        <div key={letter}>
          <Label>Option {letter}</Label>
          <Input
            value={form[`option_${letter.toLowerCase()}` as keyof typeof form]}
            onChange={(e) => update(`option_${letter.toLowerCase()}`, e.target.value)}
            required
          />
        </div>
      ))}

      <div>
        <Label>Correct Answer(s)</Label>
        <div className="flex gap-4 mt-1">
          {['A', 'B', 'C', 'D'].map((letter) => {
            const selected = form.correct_answer.split(',').filter(Boolean);
            const isChecked = selected.includes(letter);
            return (
              <label key={letter} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const next = isChecked
                      ? selected.filter((l) => l !== letter)
                      : [...selected, letter].sort();
                    update('correct_answer', next.join(','));
                  }}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">{letter}</span>
              </label>
            );
          })}
        </div>
        {form.correct_answer.includes(',') && (
          <p className="text-xs text-muted-foreground mt-1">Multiple answers selected — player will use checkboxes</p>
        )}
      </div>

      <div>
        <Label>Reference</Label>
        <Input value={form.reference} onChange={(e) => update('reference', e.target.value)} placeholder="e.g. Ref: 5.3.2" />
      </div>

      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
};

/* ─── Bulk Import Parser ─── */
interface ParsedQuestion {
  area: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  reference: string;
  status: string;
}

function parseSpreadsheet(rows: (string | number | undefined)[][]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  let current: Partial<ParsedQuestion> | null = null;
  let optionCount = 0;

  for (const row of rows) {
    const colA = String(row[0] || '').trim();  // area
    const colB = String(row[1] || '').trim();  // question number
    const colC = String(row[2] || '').trim();  // question text or option
    const colE = String(row[4] || '').trim().toLowerCase();  // 'x' = correct
    const colF = String(row[5] || '').trim();  // reference

    if (!colC) continue;

    // Detect option lines: starts with a) b) c) d)
    const optionMatch = colC.match(/^([abcd])\)\s*(.*)/i);

    if (optionMatch) {
      if (!current) continue;
      const letter = optionMatch[1].toLowerCase();
      const text = optionMatch[2].trim();
      const key = `option_${letter}` as keyof ParsedQuestion;
      (current as Record<string, string>)[key] = text;
      optionCount++;

      if (colE === 'x') {
        const prev = current.correct_answer ? current.correct_answer + ',' : '';
        current.correct_answer = prev + letter.toUpperCase();
      }

      if (colF) {
        current.reference = colF;
      }

      // After option d, push the question
      if (letter === 'd' || optionCount === 4) {
        if (current.question_text && current.option_a && current.correct_answer) {
          questions.push({
            area: current.area || '',
            question_text: current.question_text || '',
            option_a: current.option_a || '',
            option_b: current.option_b || '',
            option_c: current.option_c || '',
            option_d: current.option_d || '',
            correct_answer: current.correct_answer || 'A',
            reference: current.reference || '',
            status: 'published',
          });
        }
        current = null;
        optionCount = 0;
      }
    } else if (colB || (!optionMatch && colC && !colC.match(/^[abcd]\)/i))) {
      // New question line
      const prevArea: string = current?.area ?? '';
      if (current && current.question_text && current.option_a && current.correct_answer) {
        questions.push({
          area: current.area || '',
          question_text: current.question_text || '',
          option_a: current.option_a || '',
          option_b: current.option_b || '',
          option_c: current.option_c || '',
          option_d: current.option_d || '',
          correct_answer: current.correct_answer || 'A',
          reference: current.reference || '',
          status: 'published',
        });
      }
      current = {
        area: colA || prevArea,
        question_text: colC,
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: '',
        reference: colF || '',
        status: 'published',
      };
      optionCount = 0;
    }
  }

  // Push last question if pending
  if (current && current.question_text && current.option_a && current.correct_answer) {
    questions.push({
      area: current.area || '',
      question_text: current.question_text || '',
      option_a: current.option_a || '',
      option_b: current.option_b || '',
      option_c: current.option_c || '',
      option_d: current.option_d || '',
      correct_answer: current.correct_answer || 'A',
      reference: current.reference || '',
      status: 'published',
    });
  }

  return questions;
}

/* ─── Bulk Import Dialog ─── */
const BulkImportDialog = ({ examId, open, onOpenChange }: { examId: string; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [preview, setPreview] = useState<ParsedQuestion[]>([]);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const importMutation = useBulkImportQuestions(examId);
  const { toast } = useToast();

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 });
      const parsed = parseSpreadsheet(rows);
      if (parsed.length === 0) {
        toast({ title: 'No questions found', description: 'Check the file format matches the expected structure.', variant: 'destructive' });
      }
      setPreview(parsed);
    } catch {
      toast({ title: 'Error', description: 'Failed to parse file', variant: 'destructive' });
    }
  }, [toast]);

  const handleImport = () => {
    importMutation.mutate(preview, {
      onSuccess: () => {
        setPreview([]);
        setFileName('');
        onOpenChange(false);
      },
    });
  };

  const reset = () => {
    setPreview([]);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Bulk Import Questions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3">
            <Input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="max-w-sm"
            />
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          <p className="text-xs text-muted-foreground">
            Expected format — Col A: area, Col B: question number, Col C: question text or option (prefixed a) b) c) d)), Col E: &apos;x&apos; marks correct answer, Col F: reference
          </p>

          {preview.length > 0 && (
            <>
              <div className="text-sm font-medium">{preview.length} questions parsed</div>
              <div className="flex-1 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead className="w-16 text-center">Ans</TableHead>
                      <TableHead>Ref</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((q, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm">{q.area}</TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">{q.question_text}</TableCell>
                        <TableCell className="text-center font-mono font-bold">{q.correct_answer}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{q.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={reset}>Clear</Button>
                <Button onClick={handleImport} disabled={importMutation.isPending}>
                  {importMutation.isPending ? 'Importing...' : `Import ${preview.length} Questions`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Main Page ─── */
const AdminExamQuestions = () => {
  const { examId } = useParams<{ examId: string }>();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [filterArea, setFilterArea] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: exam, isLoading: examLoading } = useExam(examId);
  const { data: questions, isLoading: questionsLoading } = useQuestions(examId, {
    area: filterArea || undefined,
    status: filterStatus,
  });
  const { data: areas } = useQuestionAreas(examId);

  const createMutation = useCreateQuestion(examId || '');
  const updateMutation = useUpdateQuestion(examId || '');
  const deleteMutation = useDeleteQuestion(examId || '');

  const handleCreate = async (data: Record<string, unknown>) => {
    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(data as never, {
        onSuccess: () => resolve(),
        onError: reject,
      });
    });
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editingQuestion) return;
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { id: editingQuestion.id, data: data as never },
        { onSuccess: () => resolve(), onError: reject },
      );
    });
  };

  const isLoading = examLoading || questionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!exam) {
    return <div className="text-center py-8 text-red-600">Exam not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/admin/exams" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to exams
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-gray-600">
            {questions?.length ?? 0} questions &middot; Pass mark: {exam.pass_mark} &middot; {exam.duration_minutes} min
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
            <Upload className="h-4 w-4 mr-2" /> Bulk Import
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Question</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Question</DialogTitle></DialogHeader>
              <QuestionForm
                examId={examId!}
                existingAreas={areas || []}
                onClose={() => setIsAddOpen(false)}
                onSubmitCreate={handleCreate}
                onSubmitEdit={handleEdit}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select value={filterArea || '__all__'} onValueChange={(v) => setFilterArea(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All areas</SelectItem>
            {areas?.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Questions Table */}
      <Card>
        <CardHeader><CardTitle>Questions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-16 text-center">Ans</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions?.map((q, idx) => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="text-sm font-medium">{q.area}</TableCell>
                  <TableCell className="text-sm max-w-[320px] truncate">{q.question_text}</TableCell>
                  <TableCell className="text-center font-mono font-bold">{q.correct_answer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.reference}</TableCell>
                  <TableCell>
                    <Badge variant={q.status === 'published' ? 'default' : 'secondary'}>{q.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={editingQuestion?.id === q.id}
                        onOpenChange={(open) => { if (!open) setEditingQuestion(null); }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingQuestion(q)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>Edit Question</DialogTitle></DialogHeader>
                          <QuestionForm
                            examId={examId!}
                            existingAreas={areas || []}
                            editingQuestion={q}
                            onClose={() => setEditingQuestion(null)}
                            onSubmitCreate={handleCreate}
                            onSubmitEdit={handleEdit}
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
                            <AlertDialogTitle>Delete question?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(q.id)}
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
          {questions?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No questions yet. Add questions individually or use bulk import.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Import Dialog */}
      <BulkImportDialog examId={examId!} open={isBulkOpen} onOpenChange={setIsBulkOpen} />
    </div>
  );
};

export default AdminExamQuestions;
