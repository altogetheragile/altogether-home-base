import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Check, Loader2 } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useCourseAdminMutations, type CourseAdminItem } from '@/hooks/useCourseAdmin';

interface CourseContentTabProps {
  course: CourseAdminItem;
}

interface ContentForm {
  short_description: string;
  description: string;
  learning_outcomes: string[];
  key_benefits: string[];
  target_audience: string;
  prerequisites: string[];
  difficulty_rating: string;
}

const CourseContentTab = ({ course }: CourseContentTabProps) => {
  const { updateTemplate, invalidate } = useCourseAdminMutations();

  const [form, setForm] = useState<ContentForm>({
    short_description: course.short_description || '',
    description: course.description || '',
    learning_outcomes: course.learning_outcomes || [],
    key_benefits: course.key_benefits || [],
    target_audience: course.target_audience || '',
    prerequisites: course.prerequisites || [],
    difficulty_rating: course.difficulty_rating || '',
  });

  useEffect(() => {
    setForm({
      short_description: course.short_description || '',
      description: course.description || '',
      learning_outcomes: course.learning_outcomes || [],
      key_benefits: course.key_benefits || [],
      target_audience: course.target_audience || '',
      prerequisites: course.prerequisites || [],
      difficulty_rating: course.difficulty_rating || '',
    });
  }, [course.id]);

  const { isSaving, lastSaved, saveNow } = useAutoSave({
    data: form,
    onSave: async (data) => {
      await updateTemplate.mutateAsync({
        id: course.id,
        data: {
          short_description: data.short_description || null,
          description: data.description || undefined,
          learning_outcomes: data.learning_outcomes,
          key_benefits: data.key_benefits,
          target_audience: data.target_audience,
          prerequisites: data.prerequisites,
          difficulty_rating: data.difficulty_rating,
        },
      });
      invalidate();
    },
  });

  const updateList = (field: 'learning_outcomes' | 'key_benefits' | 'prerequisites', index: number, value: string) => {
    setForm(prev => {
      const list = [...prev[field]];
      list[index] = value;
      return { ...prev, [field]: list };
    });
  };

  const addToList = (field: 'learning_outcomes' | 'key_benefits' | 'prerequisites') => {
    setForm(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeFromList = (field: 'learning_outcomes' | 'key_benefits' | 'prerequisites', index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const renderListField = (label: string, field: 'learning_outcomes' | 'key_benefits' | 'prerequisites') => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {form[field].map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => updateList(field, i, e.target.value)}
            placeholder={`${label} item`}
          />
          <Button variant="ghost" size="sm" onClick={() => removeFromList(field, i)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => addToList(field)}>
        <Plus className="h-4 w-4 mr-1" /> Add
      </Button>
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

      <div className="space-y-1">
        <Label>Short Description</Label>
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
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          placeholder="Full course description..."
        />
      </div>

      {renderListField('Learning Outcomes', 'learning_outcomes')}
      {renderListField('Key Benefits', 'key_benefits')}

      <div className="space-y-2">
        <Label>Target Audience</Label>
        <Textarea
          value={form.target_audience}
          onChange={(e) => setForm(prev => ({ ...prev, target_audience: e.target.value }))}
          rows={2}
          placeholder="Who is this course for?"
        />
      </div>

      {renderListField('Prerequisites', 'prerequisites')}

      <div className="space-y-2">
        <Label>Difficulty Rating</Label>
        <Select
          value={form.difficulty_rating}
          onValueChange={(value) => setForm(prev => ({ ...prev, difficulty_rating: value }))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CourseContentTab;
