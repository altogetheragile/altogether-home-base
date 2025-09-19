import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateKnowledgeTemplate, useUpdateKnowledgeTemplate, useKnowledgeTemplate } from '@/hooks/useKnowledgeTemplates';
import { useTemplateKnowledgeItems } from '@/hooks/useKnowledgeItemTemplates';
import type { KnowledgeTemplate, TemplateType } from '@/types/template';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface TemplateFormData {
  title: string;
  description: string;
  category: string;
  is_public: boolean;
}

export default function CreateKnowledgeTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { data: existingTemplate, isLoading } = useKnowledgeTemplate(id || '');
  const { data: linkedKnowledgeItems, isLoading: isLoadingLinkedItems } = useTemplateKnowledgeItems(id || '');
  const createMutation = useCreateKnowledgeTemplate();
  const updateMutation = useUpdateKnowledgeTemplate();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TemplateFormData>({
    defaultValues: {
      title: existingTemplate?.title || '',
      description: existingTemplate?.description || '',
      category: existingTemplate?.category || '',
      is_public: existingTemplate?.is_public || false,
    }
  });

  // Update form when existing template loads
  React.useEffect(() => {
    if (existingTemplate) {
      setValue('title', existingTemplate.title);
      setValue('description', existingTemplate.description || '');
      setValue('category', existingTemplate.category || '');
      setValue('is_public', existingTemplate.is_public);
    }
  }, [existingTemplate, setValue]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: TemplateFormData) => {
    const templateData = {
      title: data.title,
      description: data.description,
      template_type: 'canvas' as const, // Default template type
      category: data.category,
      is_public: data.is_public,
      config: {
        layout: 'canvas' as const,
        dimensions: { width: 800, height: 600 },
        sections: [],
        styling: {
          backgroundColor: '#ffffff',
          fontFamily: 'Inter',
          primaryColor: '#3b82f6',
        }
      }
    };

    if (isEditing && id) {
      updateMutation.mutate(
        { 
          id, 
          data: templateData 
        },
        {
          onSuccess: () => {
            toast.success('Template updated successfully');
            navigate('/admin/knowledge-templates');
          },
          onError: (error) => {
            toast.error('Failed to update template');
            console.error('Update error:', error);
          }
        }
      );
    } else {
      createMutation.mutate(templateData, {
        onSuccess: () => {
          toast.success('Template created successfully');
          navigate('/admin/knowledge-templates');
        },
        onError: (error) => {
          toast.error('Failed to create template');
          console.error('Create error:', error);
        }
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/knowledge-templates')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h1>
        </div>
      </div>
      
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Configure the basic properties of your template. PDF templates are linked to Knowledge Items via associations and don't require a category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Template Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter template title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe what this template is for and how it should be used"
                  rows={3}
                />
              </div>


{!existingTemplate?.pdf_url && (
  <div className="space-y-2">
    <Label htmlFor="category">Category</Label>
    <Input
      id="category"
      {...register('category')}
      placeholder="e.g., Business Planning, Strategy, Assessment"
    />
  </div>
)}

{isEditing && (
  <div className="space-y-2">
    <Label>Linked Knowledge Items</Label>
    <div className="p-3 bg-muted rounded-md space-y-2">
      {isLoadingLinkedItems ? (
        <p className="text-sm text-muted-foreground">Loading linked items...</p>
      ) : linkedKnowledgeItems && linkedKnowledgeItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            This template is linked to {linkedKnowledgeItems.length} Knowledge Item{linkedKnowledgeItems.length !== 1 ? 's' : ''}:
          </p>
          {linkedKnowledgeItems.map((association: any) => (
            <div key={association.id} className="flex items-center justify-between p-2 bg-background rounded border">
              <div className="flex-1">
                <p className="text-sm font-medium">{association.knowledge_item?.name}</p>
                <p className="text-xs text-muted-foreground">/{association.knowledge_item?.slug}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/knowledge-items/edit/${association.knowledge_item?.id}`)}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Edit
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This template is not currently linked to any Knowledge Items. 
          You can associate it with Knowledge Items from the Knowledge Items admin section.
        </p>
      )}
    </div>
  </div>
)}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={watch('is_public')}
                  onCheckedChange={(checked) => setValue('is_public', checked)}
                />
                <Label htmlFor="is_public">Make template publicly available</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/knowledge-templates')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}