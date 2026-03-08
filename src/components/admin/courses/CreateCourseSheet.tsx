import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useCourseAdminMutations } from '@/hooks/useCourseAdmin';

interface CreateCourseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

const CreateCourseSheet = ({ open, onOpenChange, onCreated }: CreateCourseSheetProps) => {
  const { createTemplate, invalidate } = useCourseAdminMutations();
  const { data: eventTypes = [] } = useEventTypes();
  const { data: categories = [] } = useEventCategories();

  const [form, setForm] = useState({
    title: '',
    short_description: '',
    event_type_id: '',
    category_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const result = await createTemplate.mutateAsync({
        title: form.title,
        short_description: form.short_description || null,
        duration_days: 1,
        ...({ event_type_id: form.event_type_id || undefined } as any),
        ...({ category_id: form.category_id || undefined } as any),
      });
      invalidate();
      onOpenChange(false);
      setForm({ title: '', short_description: '', event_type_id: '', category_id: '' });
      if (result?.id && onCreated) onCreated(result.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[540px] sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>New Course</SheetTitle>
          <SheetDescription>Create a new course template</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Course title"
            />
          </div>

          <div className="space-y-1">
            <Label>Short description</Label>
            <Textarea
              value={form.short_description}
              onChange={(e) => setForm(prev => ({ ...prev, short_description: e.target.value.slice(0, 200) }))}
              rows={3}
              placeholder="1-2 sentence summary for the listing page..."
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Shown on the course listing page. Keep it to 1-2 sentences.</span>
              <span>{form.short_description.length} / 200</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select
              value={form.event_type_id}
              onValueChange={(v) => setForm(prev => ({ ...prev, event_type_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm(prev => ({ ...prev, category_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.title.trim() || submitting}>
            {submitting ? 'Creating...' : 'Create Course'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateCourseSheet;
