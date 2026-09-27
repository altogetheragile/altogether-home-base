import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useAddFeedback } from '@/hooks/useCourseFeedback';

// ============= One recommendation, typed in =============
//
// Recommendations arrive one at a time, by email or on LinkedIn. The only way to get one onto
// the site was to build a spreadsheet with the right column headings and import it, which is a
// strange thing to do for a single paragraph somebody has just sent you.
//
// Only the words are required. A recommendation with no rating, no company and no course is
// still a recommendation, and the site renders every one of those as absent rather than as a
// gap: the course badge only appears when there is a course, the stars only when there is a
// score. Requiring them would put "Unknown Course" on the page, which is what the importer does.

/** Where a recommendation came from. Free text in the database, so this is a shortlist rather
 *  than a constraint, and it matches what the importer writes. */
const SOURCES = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'in_person', label: 'In person' },
  { value: 'manual', label: 'Somewhere else' },
];

const EMPTY = {
  first_name: '', last_name: '', comment: '', company: '', job_title: '',
  course_name: '', source: 'linkedin', source_url: '', score: '',
};

export function AddFeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [approved, setApproved] = useState(true);
  const add = useAddFeedback();

  const set = (key: keyof typeof EMPTY, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const ready = form.comment.trim().length > 0 && form.first_name.trim().length > 0;

  const save = () => {
    const score = form.score.trim() === '' ? null : Math.min(10, Math.max(1, Math.round(Number(form.score))));
    add.mutate({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      comment: form.comment.trim(),
      // Empty means absent, not empty: the site checks these for truthiness before drawing them.
      company: form.company.trim() || null,
      job_title: form.job_title.trim() || null,
      course_name: form.course_name.trim() || null,
      source: form.source,
      source_url: form.source_url.trim() || null,
      rating: Number.isFinite(score as number) ? score : null,
      is_approved: approved,
      // Featured is a decision about the front page, made on the row afterwards rather than
      // buried in the form that adds it.
      is_featured: false,
      submitted_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, {
      onSuccess: () => { setForm({ ...EMPTY }); setApproved(true); setOpen(false); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default"><Plus className="mr-2 h-4 w-4" />Add a testimonial</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add a testimonial</DialogTitle>
          <DialogDescription>
            For a recommendation somebody has sent you. Only their first name and their words are
            needed; anything left empty simply does not appear on the site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="comment">What they said</Label>
            <Textarea
              id="comment" rows={5} value={form.comment}
              onChange={(e) => set('comment', e.target.value)}
              placeholder="Paste the recommendation here"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="job_title">Their role</Label>
              <Input id="job_title" value={form.job_title} onChange={(e) => set('job_title', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="company">Their company</Label>
              <Input id="company" value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="course_name">What it was about</Label>
              <Input
                id="course_name" value={form.course_name}
                onChange={(e) => set('course_name', e.target.value)}
                placeholder="A course, or leave empty"
              />
            </div>
            <div>
              <Label htmlFor="score">Score out of 10</Label>
              <Input
                id="score" type="number" min={1} max={10} value={form.score}
                onChange={(e) => set('score', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="source">Where it came from</Label>
              <Select value={form.source} onValueChange={(v) => set('source', v)}>
                <SelectTrigger id="source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source_url">Link to the original</Label>
              <Input
                id="source_url" value={form.source_url}
                onChange={(e) => set('source_url', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border p-3">
            <Switch checked={approved} onCheckedChange={setApproved} aria-label="Show it on the site" />
            <span className="text-sm">
              <span className="font-medium">Show it on the site</span>
              <span className="block text-muted-foreground">
                On, because whoever typed this in has already read it. Off saves it for later and
                leaves it off the site.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!ready || add.isPending}>
            {add.isPending ? 'Adding...' : 'Add it'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddFeedbackDialog;
