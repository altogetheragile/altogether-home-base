import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Form } from '@/components/ui/form';
import { FormStepper } from '@/components/admin/knowledge/editor/FormStepper';
import { BasicInfoSection } from '@/components/admin/knowledge/editor/sections/BasicInfoSection';
import { ClassificationSection } from '@/components/admin/knowledge/editor/sections/ClassificationSection';
import { ContentSection } from '@/components/admin/knowledge/editor/sections/ContentSection';
import { EnhancedSection } from '@/components/admin/knowledge/editor/sections/EnhancedSection';
import { KnowledgeItemUseCases } from '@/components/admin/knowledge/editor/KnowledgeItemUseCases';
import { KnowledgeItemAnalytics } from '@/components/admin/knowledge/editor/KnowledgeItemAnalytics';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { knowledgeItemSchema, knowledgeItemDefaults, KnowledgeItemFormData } from '@/schemas/knowledgeItem';
import { Info, FolderOpen, BookOpen, Sparkles, FileText, BarChart3 } from 'lucide-react';

const EditKnowledgeItemRefactored = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const createKnowledgeItem = useCreateKnowledgeItem();
  const updateKnowledgeItem = useUpdateKnowledgeItem();

  const isEditing = !!id && id !== 'new';

  const form = useForm({
    resolver: zodResolver(knowledgeItemSchema) as any,
    defaultValues: knowledgeItemDefaults as any,
    mode: 'onBlur',
  });

  // Fetch existing knowledge item data
  const { data: knowledgeItem, isLoading } = useQuery({
    queryKey: ['knowledge-item', id],
    queryFn: async () => {
      if (!isEditing || !id || id === 'new') return null;
      
      const { data, error } = await supabase
        .from('knowledge_items')
        .select(`
          *,
          knowledge_categories (id, name, slug, color),
          planning_layers (id, name, slug, color),
          activity_domains (id, name, slug, color),
          knowledge_use_cases (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isEditing && id && id !== 'new',
  });

  // Populate form when data loads
  useEffect(() => {
    if (knowledgeItem && isEditing) {
      const formData: Partial<KnowledgeItemFormData> = {
        name: knowledgeItem.name || '',
        slug: knowledgeItem.slug || '',
        description: knowledgeItem.description || '',
        background: knowledgeItem.background || '',
        source: knowledgeItem.source || '',
        author: knowledgeItem.author || '',
        reference_url: knowledgeItem.reference_url || '',
        publication_year: knowledgeItem.publication_year || undefined,
        category_id: knowledgeItem.category_id || '',
        planning_layer_id: knowledgeItem.planning_layer_id || '',
        domain_id: knowledgeItem.domain_id || '',
        is_published: knowledgeItem.is_published || false,
        is_featured: knowledgeItem.is_featured || false,
        common_pitfalls: knowledgeItem.common_pitfalls || [],
        evidence_sources: knowledgeItem.evidence_sources || [],
        related_techniques: knowledgeItem.related_techniques || [],
        learning_value_summary: knowledgeItem.learning_value_summary || '',
        key_terminology: knowledgeItem.key_terminology || {},
      };

      // Reset form with fetched data
      form.reset(formData);
    }
  }, [knowledgeItem, isEditing, form]);

  // Step configuration
  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Set the core details for this knowledge item',
      icon: <Info className="h-5 w-5" />,
      requiredFields: ['name', 'slug'] as (keyof KnowledgeItemFormData)[],
    },
    {
      id: 'classification',
      title: 'Classification',
      description: 'Organize with categories, layers, and domains',
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      id: 'content',
      title: 'Content',
      description: 'Add detailed background and context',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      id: 'enhanced',
      title: 'Enhanced Information',
      description: 'Add insights, pitfalls, and terminology',
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: 'usecases',
      title: 'Use Cases',
      description: 'Create and manage use cases',
      icon: <FileText className="h-5 w-5" />,
    },
    ...(isEditing ? [{
      id: 'analytics',
      title: 'Analytics',
      description: 'View performance and insights',
      icon: <BarChart3 className="h-5 w-5" />,
    }] : []),
  ];

  const onSubmit = async (data: any) => {
    try {
      // Sanitize data before sending to database
      const sanitizedData = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || null,
        background: data.background?.trim() || null,
        source: data.source?.trim() || null,
        author: data.author?.trim() || null,
        reference_url: data.reference_url?.trim() || null,
        publication_year: data.publication_year || null,
        category_id: data.category_id?.trim() || null,
        planning_layer_id: data.planning_layer_id?.trim() || null,
        domain_id: data.domain_id?.trim() || null,
        is_published: data.is_published || false,
        is_featured: data.is_featured || false,
        common_pitfalls: data.common_pitfalls || [],
        evidence_sources: data.evidence_sources || [],
        related_techniques: data.related_techniques || [],
        learning_value_summary: data.learning_value_summary?.trim() || null,
        key_terminology: data.key_terminology || {},
      };
      
      if (isEditing) {
        await updateKnowledgeItem.mutateAsync({
          id: id!,
          ...sanitizedData,
          updated_by: user?.id
        });
        toast({
          title: "Knowledge item updated",
          description: "Your changes have been saved.",
        });
      } else {
        const newItem = await createKnowledgeItem.mutateAsync({
          ...sanitizedData,
          created_by: user?.id,
          updated_by: user?.id
        });
        toast({
          title: "Knowledge item created",
          description: "Your knowledge item has been created successfully.",
        });
        // Redirect to edit mode for the newly created item
        navigate(`/admin/knowledge/items/${newItem.id}/edit`);
        return;
      }
      
      navigate('/admin/knowledge/items');
    } catch (error: any) {
      console.error('Error saving knowledge item:', error);
      toast({
        title: "Error saving knowledge item",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Auto-save draft functionality (debounced)
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && isEditing) {
        // Auto-save logic could be implemented here
        // For now, we'll skip this to keep it simple
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  // Navigation guard for unsaved changes
  const hasUnsavedChanges = form.formState.isDirty;

  const renderStepContent = () => {
    const stepId = steps[currentStep]?.id;
    
    switch (stepId) {
      case 'basic':
        return <BasicInfoSection />;
      case 'classification':
        return <ClassificationSection />;
      case 'content':
        return <ContentSection knowledgeItemId={isEditing ? id : undefined} />;
      case 'enhanced':
        return <EnhancedSection />;
      case 'usecases':
        return (
          <KnowledgeItemUseCases
            knowledgeItemId={isEditing ? id : undefined}
            onSaveItem={!isEditing ? form.handleSubmit(onSubmit) : undefined}
            onAddUseCase={() => {
              if (!id || id === "new") {
                toast({
                  title: "Please save the knowledge item first",
                  description: "You need to save the knowledge item before adding use cases.",
                  variant: "destructive",
                });
                return;
              }
              // Navigate to inline use case creation
            }}
            onEditUseCase={() => {
              // Handle inline use case editing
            }}
          />
        );
      case 'analytics':
        return isEditing ? <KnowledgeItemAnalytics knowledgeItem={knowledgeItem} /> : null;
      default:
        return null;
    }
  };

  const isLoading_ = createKnowledgeItem.isPending || updateKnowledgeItem.isPending;

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isEditing && !knowledgeItem && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Knowledge item not found</p>
        <Button onClick={() => navigate('/admin/knowledge/items')} className="mt-4">
          Back to Knowledge Items
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/admin/knowledge/items')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Items
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Update knowledge item details' : 'Add a new knowledge item'}
          </p>
        </div>
      </div>

      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-7xl space-y-6">
            {/* Stepper Navigation */}
            <FormStepper
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              form={form as any}
            />

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t pt-6">
              <div className="flex space-x-4">
                <Button type="submit" disabled={isLoading_} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isLoading_ ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Knowledge Item')}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/knowledge/items')}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>

              {/* Form Status */}
              <div className="text-sm text-muted-foreground">
                {hasUnsavedChanges && (
                  <span className="text-orange-600">• Unsaved changes</span>
                )}
                {form.formState.isValid && (
                  <span className="text-green-600">• Form is valid</span>
                )}
                {Object.keys(form.formState.errors).length > 0 && (
                  <span className="text-destructive">
                    • {Object.keys(form.formState.errors).length} validation error(s)
                  </span>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  );
};

export default EditKnowledgeItemRefactored;
