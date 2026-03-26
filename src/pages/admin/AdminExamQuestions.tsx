import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Trash2, Upload, ArrowLeft, FileSpreadsheet, ChevronDown, ChevronRight, Check } from 'lucide-react';
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

/* ─── Inline Editable Field ─── */
const EditableText = ({
  value,
  onChange,
  multiline,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) => {
  const [local, setLocal] = useState(value);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = local.trim();
    if (trimmed !== value) onChange(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setLocal(value); setEditing(false); }
    if (e.key === 'Enter' && !multiline) { commit(); }
    if (e.key === 'Enter' && e.metaKey && multiline) { commit(); }
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 ${!value ? 'text-muted-foreground italic' : ''} ${className || ''}`}
        title="Click to edit"
      >
        {value || placeholder || '(empty)'}
      </span>
    );
  }

  if (multiline) {
    return (
      <Textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        rows={3}
        className={`text-sm ${className || ''}`}
      />
    );
  }

  return (
    <Input
      ref={ref as React.RefObject<HTMLInputElement>}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={`text-sm h-8 ${className || ''}`}
    />
  );
};

/* ─── Correct Answer Selector ─── */
const AnswerSelector = ({
  value,
  visibleOptions,
  onChange,
}: {
  value: string;
  visibleOptions: string[];
  onChange: (v: string) => void;
}) => {
  const selected = value.split(',').filter(Boolean);
  return (
    <div className="flex gap-1 flex-wrap">
      {visibleOptions.map((letter) => {
        const isSelected = selected.includes(letter);
        return (
          <button
            key={letter}
            type="button"
            onClick={() => {
              const next = isSelected
                ? selected.filter((l) => l !== letter)
                : [...selected, letter].sort();
              if (next.length > 0) onChange(next.join(','));
            }}
            className={`w-7 h-7 rounded text-xs font-bold border transition-colors ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
};

/* ─── Expanded Question Row ─── */
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

const ExpandedQuestion = ({
  question,
  onUpdate,
  onDelete,
}: {
  question: Question;
  onUpdate: (field: string, value: string) => void;
  onDelete: () => void;
}) => {
  const visibleOptions = OPTION_LETTERS.filter((letter, i) => {
    if (i < 4) return true;
    const val = question[`option_${letter.toLowerCase()}` as keyof Question] as string;
    const prevVal = question[`option_${OPTION_LETTERS[i - 1].toLowerCase()}` as keyof Question] as string;
    return (val && val !== '') || (prevVal && prevVal !== '');
  });

  return (
    <TableRow>
      <TableCell colSpan={7} className="bg-muted/30 p-0">
        <div className="px-6 py-4 space-y-4">
          {/* Area + Reference + Status row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Area</Label>
              <div className="relative">
                <EditableText
                  value={question.area}
                  onChange={(v) => onUpdate('area', v)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Reference</Label>
              <EditableText
                value={question.reference || ''}
                onChange={(v) => onUpdate('reference', v)}
                placeholder="e.g. 5.3.2"
              />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                <Select value={question.status} onValueChange={(v) => onUpdate('status', v)}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Question text */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Question</Label>
            <EditableText
              value={question.question_text}
              onChange={(v) => onUpdate('question_text', v)}
              multiline
            />
          </div>

          {/* Options + Correct Answer */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {visibleOptions.map((letter) => {
              const key = `option_${letter.toLowerCase()}` as keyof Question;
              const isCorrect = question.correct_answer.split(',').includes(letter);
              return (
                <div key={letter} className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-4 flex-shrink-0 ${isCorrect ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {letter})
                  </span>
                  {isCorrect && <Check className="h-3 w-3 text-green-600 flex-shrink-0" />}
                  <EditableText
                    value={(question[key] as string) || ''}
                    onChange={(v) => onUpdate(key, v)}
                    className="flex-1"
                  />
                </div>
              );
            })}
          </div>

          {/* Correct answer toggles */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Correct Answer(s)</Label>
            <AnswerSelector
              value={question.correct_answer}
              visibleOptions={visibleOptions.map(String)}
              onChange={(v) => onUpdate('correct_answer', v)}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

/* ─── Add Question Form (simplified inline) ─── */
const AddQuestionForm = ({
  examId,
  existingAreas,
  onClose,
  onCreate,
}: {
  examId: string;
  existingAreas: string[];
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => Promise<void>;
}) => {
  const [form, setForm] = useState({
    area: '', question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    option_e: '', option_f: '', option_g: '',
    correct_answer: 'A', reference: '', status: 'published',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const visibleOptions = OPTION_LETTERS.filter((letter, i) => {
    if (i < 4) return true;
    const key = `option_${letter.toLowerCase()}` as keyof typeof form;
    const prevKey = `option_${OPTION_LETTERS[i - 1].toLowerCase()}` as keyof typeof form;
    return form[key] !== '' || form[prevKey] !== '';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({ ...form, exam_id: examId });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Area</Label>
        <Input list="area-list" value={form.area} onChange={(e) => update('area', e.target.value)} required placeholder="e.g. Planning, Delivery" />
        <datalist id="area-list">{existingAreas.map((a) => <option key={a} value={a} />)}</datalist>
      </div>
      <div>
        <Label>Question Text</Label>
        <Textarea value={form.question_text} onChange={(e) => update('question_text', e.target.value)} required rows={3} />
      </div>
      {visibleOptions.map((letter, i) => (
        <div key={letter}>
          <Label>Option {letter}</Label>
          <Input
            value={form[`option_${letter.toLowerCase()}` as keyof typeof form]}
            onChange={(e) => update(`option_${letter.toLowerCase()}`, e.target.value)}
            required={i < 2}
            placeholder={i >= 4 ? '(optional)' : undefined}
          />
        </div>
      ))}
      <div>
        <Label>Correct Answer(s)</Label>
        <div className="flex gap-4 mt-1 flex-wrap">
          {visibleOptions.map((letter) => {
            const selected = form.correct_answer.split(',').filter(Boolean);
            const isChecked = selected.includes(letter);
            return (
              <label key={letter} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox" checked={isChecked}
                  onChange={() => {
                    const next = isChecked ? selected.filter((l) => l !== letter) : [...selected, letter].sort();
                    update('correct_answer', next.join(','));
                  }}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">{letter}</span>
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <Label>Reference</Label>
        <Input value={form.reference} onChange={(e) => update('reference', e.target.value)} placeholder="e.g. 5.3.2" />
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
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Question'}</Button>
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
  option_e: string;
  option_f: string;
  option_g: string;
  correct_answer: string;
  reference: string;
  status: string;
}

function emptyQuestion(): Omit<ParsedQuestion, 'area' | 'question_text' | 'reference' | 'status'> {
  return { option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', option_f: '', option_g: '', correct_answer: '' };
}

function pushIfValid(questions: ParsedQuestion[], current: Partial<ParsedQuestion> | null) {
  if (current && current.question_text && current.option_a && current.correct_answer) {
    questions.push({
      area: current.area || '',
      question_text: current.question_text || '',
      ...emptyQuestion(),
      ...current,
      reference: current.reference || '',
      status: 'published',
    } as ParsedQuestion);
  }
}

function parseSpreadsheet(rows: (string | number | undefined)[][]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  let current: Partial<ParsedQuestion> | null = null;
  const correctAnswers: string[] = [];

  for (const row of rows) {
    const colA = String(row[0] || '').trim();
    const colC = String(row[2] || '').trim();
    const colE = String(row[4] || '').trim().toLowerCase();
    const colF = String(row[5] || '').trim();

    if (!colC) continue;

    const optionMatch = colC.match(/^([a-g])\)\s*(.*)/i);

    if (optionMatch) {
      if (!current) continue;
      const letter = optionMatch[1].toLowerCase();
      const text = optionMatch[2].trim();
      const key = `option_${letter}` as keyof ParsedQuestion;
      (current as Record<string, string>)[key] = text;

      if (colE === 'x') {
        correctAnswers.push(letter.toUpperCase());
      }

      if (colF) {
        current.reference = colF;
      }
    } else {
      const prevArea: string = current?.area ?? '';
      if (current) {
        current.correct_answer = correctAnswers.join(',');
        pushIfValid(questions, current);
      }
      correctAnswers.length = 0;
      current = {
        area: colA || prevArea,
        question_text: colC,
        ...emptyQuestion(),
        correct_answer: '',
        reference: colF || '',
        status: 'published',
      };
    }
  }

  if (current) {
    current.correct_answer = correctAnswers.join(',');
    pushIfValid(questions, current);
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
            <Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="max-w-sm" />
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const handleFieldUpdate = (questionId: string, field: string, value: string) => {
    updateMutation.mutate({
      id: questionId,
      data: { [field]: value } as never,
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
              <AddQuestionForm
                examId={examId!}
                existingAreas={areas || []}
                onClose={() => setIsAddOpen(false)}
                onCreate={handleCreate}
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
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-16 text-center">Ans</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions?.map((q, idx) => {
                const isExpanded = expandedId === q.id;
                return (
                  <>
                    <TableRow
                      key={q.id}
                      className={`cursor-pointer hover:bg-muted/50 ${isExpanded ? 'bg-muted/30' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    >
                      <TableCell className="text-muted-foreground px-2">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{q.area}</TableCell>
                      <TableCell className="text-sm max-w-[320px] truncate">{q.question_text}</TableCell>
                      <TableCell className="text-center font-mono font-bold">{q.correct_answer}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{q.reference}</TableCell>
                      <TableCell>
                        <Badge variant={q.status === 'published' ? 'default' : 'secondary'}>{q.status}</Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <ExpandedQuestion
                        key={`${q.id}-expanded`}
                        question={q}
                        onUpdate={(field, value) => handleFieldUpdate(q.id, field, value)}
                        onDelete={() => { deleteMutation.mutate(q.id); setExpandedId(null); }}
                      />
                    )}
                  </>
                );
              })}
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
