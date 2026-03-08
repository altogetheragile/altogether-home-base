import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
    description: '',
    event_type_id: '',
    category_id: '',
    is_published: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const result = await createTemplate.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        duration_days: 1,
        ...({ event_type_id: form.event_type_id || undefined } as any),
        ...({ category_id: form.category_id || undefined } as any),
      });
      invalidate();
      onOpenChange(false);
      setForm({ title: '', description: '', event_type_id: '', category_id: '', is_published: false });
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

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Brief description..."
            />
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
