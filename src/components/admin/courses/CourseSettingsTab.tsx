import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Loader2 } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useLevels } from '@/hooks/useLevels';
import { useFormats } from '@/hooks/useFormats';
import { useCourseAdminMutations, type CourseAdminItem } from '@/hooks/useCourseAdmin';

interface CourseSettingsTabProps {
  course: CourseAdminItem;
}

interface SettingsForm {
  is_published: boolean;
  duration_days: number;
  event_type_id: string;
  category_id: string;
  level_id: string;
  format_id: string;
  template_tags: string;
}

const CourseSettingsTab = ({ course }: CourseSettingsTabProps) => {
  const { updateTemplate, invalidate } = useCourseAdminMutations();
  const { data: eventTypes = [] } = useEventTypes();
  const { data: categories = [] } = useEventCategories();
  const { data: levels = [] } = useLevels();
  const { data: formats = [] } = useFormats();

  const [form, setForm] = useState<SettingsForm>({
    is_published: course.is_published ?? false,
    duration_days: course.duration_days || 1,
    event_type_id: course.event_type_id || '',
    category_id: course.category_id || '',
    level_id: course.level_id || '',
    format_id: course.format_id || '',
    template_tags: (course.template_tags || []).join(', '),
  });

  useEffect(() => {
    setForm({
      is_published: course.is_published ?? false,
      duration_days: course.duration_days || 1,
      event_type_id: course.event_type_id || '',
      category_id: course.category_id || '',
      level_id: course.level_id || '',
      format_id: course.format_id || '',
      template_tags: (course.template_tags || []).join(', '),
    });
  }, [course.id]);

  const { isSaving, lastSaved, saveNow } = useAutoSave({
    data: form,
    onSave: async (data) => {
      const tags = data.template_tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await updateTemplate.mutateAsync({
        id: course.id,
        data: {
          is_published: data.is_published,
          duration_days: data.duration_days,
          ...({ event_type_id: data.event_type_id || null } as any),
          ...({ category_id: data.category_id || null } as any),
          ...({ level_id: data.level_id || null } as any),
          ...({ format_id: data.format_id || null } as any),
          ...({ template_tags: tags } as any),
        },
      });
      invalidate();
    },
  });

  const renderSelect = (
    label: string,
    value: string,
    field: keyof SettingsForm,
    options: { id: string; name: string }[]
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => setForm(prev => ({ ...prev, [field]: v }))}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isSaving ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" /> Saved</span>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={saveNow}>Save</Button>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Published</Label>
          <p className="text-xs text-muted-foreground">Published courses appear on the public events page</p>
        </div>
        <Switch
          checked={form.is_published}
          onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_published: checked }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Duration (days)</Label>
          <Input
            type="number"
            min={1}
            value={form.duration_days}
            onChange={(e) => setForm(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 1 }))}
          />
        </div>

        {renderSelect('Event Type', form.event_type_id, 'event_type_id', eventTypes)}
        {renderSelect('Category', form.category_id, 'category_id', categories)}
        {renderSelect('Level', form.level_id, 'level_id', levels)}
        {renderSelect('Format', form.format_id, 'format_id', formats)}

        <div className="space-y-2 col-span-2">
          <Label>Tags (comma-separated)</Label>
          <Input
            value={form.template_tags}
            onChange={(e) => setForm(prev => ({ ...prev, template_tags: e.target.value }))}
            placeholder="agile, scrum, leadership"
          />
        </div>
      </div>
    </div>
  );
};

export default CourseSettingsTab;
