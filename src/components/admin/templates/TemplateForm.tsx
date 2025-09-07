import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateKnowledgeTemplate, useUpdateKnowledgeTemplate } from '@/hooks/useKnowledgeTemplates';
import { KnowledgeTemplate, TemplateType } from '@/types/template';

const templateFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  template_type: z.enum(['canvas', 'matrix', 'worksheet', 'process', 'form']),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
  is_public: z.boolean(),
});

type TemplateFormSchema = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  template?: KnowledgeTemplate;
  onSuccess?: () => void;
}

const templateTypeOptions: { value: TemplateType; label: string; description: string }[] = [
  {
    value: 'canvas',
    label: 'Canvas',
    description: 'Visual canvases like Business Model Canvas, Empathy Map'
  },
  {
    value: 'matrix',
    label: 'Matrix',
    description: 'Grid-based tools like SWOT, Impact-Effort Matrix'
  },
  {
    value: 'worksheet',
    label: 'Worksheet',
    description: 'Structured worksheets like 5 Whys, RICE Scoring'
  },
  {
    value: 'process',
    label: 'Process',
    description: 'Flow-based diagrams like Customer Journey Maps'
  },
  {
    value: 'form',
    label: 'Form',
    description: 'Simple forms like surveys, checklists'
  },
];

const commonCategories = [
  'Discovery & Research',
  'Planning & Prioritization',
  'Design & Ideation',
  'Analysis & Decision Making',
  'Retrospectives & Improvement',
  'Strategy & Business Model',
];

export default function TemplateForm({ template, onSuccess }: TemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTemplate = useCreateKnowledgeTemplate();
  const updateTemplate = useUpdateKnowledgeTemplate();

  const form = useForm<TemplateFormSchema>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: template?.title || '',
      description: template?.description || '',
      template_type: template?.template_type || 'canvas',
      category: template?.category || '',
      is_public: template?.is_public ?? true,
    },
  });

  const onSubmit = async (data: TemplateFormSchema) => {
    try {
      setIsSubmitting(true);
      
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, data });
      } else {
        await createTemplate.mutateAsync(data);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Business Model Canvas Template" {...field} />
              </FormControl>
              <FormDescription>
                Give your template a clear, descriptive name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this template is for and how to use it..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Explain the purpose and usage of this template.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="template_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templateTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the type that best matches your template's structure.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select or type a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commonCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Or type a custom category name above.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Template</FormLabel>
                <FormDescription>
                  Make this template available to all users in the Knowledge Base.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Saving...' : template ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}