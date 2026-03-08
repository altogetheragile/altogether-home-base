import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { useFormats } from '@/hooks/useFormats';
import { useCourseAdminMutations } from '@/hooks/useCourseAdmin';
import { addDays, format as formatDate } from 'date-fns';

interface AddDateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateTitle: string;
  durationDays: number;
}

const AddDateSheet = ({ open, onOpenChange, templateId, templateTitle, durationDays }: AddDateSheetProps) => {
  const { createEvent, invalidate } = useCourseAdminMutations();
  const { data: formats = [] } = useFormats();

  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    location: '',
    format_id: '',
    price_cents: 0,
    currency: 'GBP',
    capacity: '',
    instructor: '',
    is_published: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleStartDateChange = (value: string) => {
    const endDate = value && durationDays > 1
      ? formatDate(addDays(new Date(value), durationDays - 1), 'yyyy-MM-dd')
      : value;
    setForm(prev => ({ ...prev, start_date: value, end_date: endDate }));
  };

  const handleSubmit = async () => {
    if (!form.start_date) return;
    setSubmitting(true);
    try {
      await createEvent.mutateAsync({
        title: templateTitle,
        start_date: form.start_date,
        end_date: form.end_date || form.start_date,
        ...({ template_id: templateId } as any),
        ...({ price_cents: form.price_cents } as any),
        ...({ currency: form.currency } as any),
        ...({ capacity: form.capacity ? parseInt(form.capacity) : undefined } as any),
        ...({ is_published: form.is_published } as any),
        status: form.is_published ? 'published' : 'draft',
      } as any);
      invalidate();
      onOpenChange(false);
      setForm({
        start_date: '', end_date: '', location: '', format_id: '',
        price_cents: 0, currency: 'GBP', capacity: '', instructor: '', is_published: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[540px] sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Add a Date</SheetTitle>
          <SheetDescription>Schedule a new date for "{templateTitle}"</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Venue or online"
            />
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={form.format_id}
              onValueChange={(v) => setForm(prev => ({ ...prev, format_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (pence)</Label>
              <Input
                type="number"
                min={0}
                value={form.price_cents}
                onChange={(e) => setForm(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm(prev => ({ ...prev, currency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm(prev => ({ ...prev, capacity: e.target.value }))}
              placeholder="Max participants"
            />
          </div>

          <div className="space-y-2">
            <Label>Instructor</Label>
            <Input
              value={form.instructor}
              onChange={(e) => setForm(prev => ({ ...prev, instructor: e.target.value }))}
              placeholder="Instructor name"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_published}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_published: checked }))}
            />
            <Label>Publish immediately</Label>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.start_date || submitting}>
            {submitting ? 'Adding...' : 'Add Date'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AddDateSheet;
