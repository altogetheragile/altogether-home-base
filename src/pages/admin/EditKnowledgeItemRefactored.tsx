import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Form } from '@/components/ui/form';
import { CompactHeader } from '@/components/admin/knowledge/editor/CompactHeader';
import { VerticalStepper } from '@/components/admin/knowledge/editor/VerticalStepper';
import { LivePreviewPanel } from '@/components/admin/knowledge/editor/LivePreviewPanel';
import { BottomNavigationBar } from '@/components/admin/knowledge/editor/BottomNavigationBar';
import { ContentSectionWrapper } from '@/components/admin/knowledge/editor/ContentSectionWrapper';
import { InlineUseCaseManager } from '@/components/admin/knowledge/editor/InlineUseCaseManager';
import { BasicInfoSection } from '@/components/admin/knowledge/editor/sections/BasicInfoSection';
import { ClassificationSection } from '@/components/admin/knowledge/editor/sections/ClassificationSection';
import { ContentSection } from '@/components/admin/knowledge/editor/sections/ContentSection';
import { EnhancedSection } from '@/components/admin/knowledge/editor/sections/EnhancedSection';
import { KnowledgeItemAnalytics } from '@/components/admin/knowledge/editor/KnowledgeItemAnalytics';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningLayers } from '@/hooks/usePlanningLayers';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useDebounce } from '@/hooks/useDebounce';
import { knowledgeItemSchema, knowledgeItemDefaults, KnowledgeItemFormData } from '@/schemas/knowledgeItem';
import { Info, FolderOpen, BookOpen, Sparkles, FileText, BarChart3 } from 'lucide-react';

const EditKnowledgeItemRefactored = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isStepperCollapsed, setIsStepperCollapsed] = useState(false);

  const createKnowledgeItem = useCreateKnowledgeItem();
  const updateKnowledgeItem = useUpdateKnowledgeItem();
  
  // Fetch categories, layers, and domains for preview and classification
  const { data: categories } = useKnowledgeCategories();
  const { data: planningLayers } = usePlanningLayers();
  const { data: domains } = useActivityDomains();

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
  const formValues = form.watch();
  const debouncedFormValues = useDebounce(formValues, 3000); // 3-second delay

  // Calculate overall completion percentage
  const getOverallCompletion = (): number => {
    const allRequiredFields = steps.flatMap(step => step.requiredFields || []);
    if (allRequiredFields.length === 0) return 100;
    
    const completedFields = allRequiredFields.filter(field => {
      const value = formValues[field];
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
    
    return Math.round((completedFields.length / allRequiredFields.length) * 100);
  };

  const performAutoSave = useCallback(async (data: any) => {
    if (!isEditing || !form.formState.isDirty) return;
    
    try {
      setAutoSaveStatus('saving');
      
      const sanitizedData = {
        name: data.name?.trim() || '',
        slug: data.slug?.trim() || '',
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

      await updateKnowledgeItem.mutateAsync({
        id: id!,
        ...sanitizedData,
        updated_by: user?.id
      });

      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset dirty state after successful auto-save
      form.reset(data, { keepValues: true });
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  }, [isEditing, form, updateKnowledgeItem, id, user?.id]);

  useEffect(() => {
    if (isEditing && form.formState.isDirty) {
      performAutoSave(debouncedFormValues);
    }
  }, [debouncedFormValues, performAutoSave, isEditing, form.formState.isDirty]);

  const errorCount = Object.keys(form.formState.errors).length;
  const overallCompletion = getOverallCompletion();

  // Navigation guard for unsaved changes
  const hasUnsavedChanges = form.formState.isDirty;

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;
    
    const stepId = step.id;
    let content = null;
    
    switch (stepId) {
      case 'basic':
        content = <BasicInfoSection />;
        break;
      case 'classification':
        content = <ClassificationSection />;
        break;
      case 'content':
        content = <ContentSection knowledgeItemId={isEditing ? id : undefined} />;
        break;
      case 'enhanced':
        content = <EnhancedSection />;
        break;
      case 'usecases':
        content = (
          <InlineUseCaseManager
            knowledgeItemId={isEditing ? id : undefined}
            onSaveItem={!isEditing ? form.handleSubmit(onSubmit) : undefined}
          />
        );
        break;
      case 'analytics':
        content = isEditing ? <KnowledgeItemAnalytics knowledgeItem={knowledgeItem} /> : null;
        break;
      default:
        content = null;
    }
    
    return (
      <ContentSectionWrapper
        title={step.title}
        description={step.description}
        icon={step.icon}
        isActive={true}
        className="mb-6"
      >
        {content}
      </ContentSectionWrapper>
    );
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
    <div className="min-h-screen bg-background pb-20">
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Compact Header */}
            <CompactHeader
              title={isEditing ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
              isEditing={isEditing}
              currentStep={currentStep}
              totalSteps={steps.length}
              completionPercentage={overallCompletion}
              errorCount={errorCount}
              onBack={() => navigate('/admin/knowledge/items')}
              isCompactMode={isCompactMode}
              onToggleCompactMode={() => setIsCompactMode(!isCompactMode)}
            />

            {/* Main Layout */}
            <div className="flex min-h-screen">
              {/* Vertical Stepper Sidebar */}
              <VerticalStepper
                steps={steps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                form={form as any}
                isCollapsed={isStepperCollapsed}
                onToggleCollapsed={() => setIsStepperCollapsed(!isStepperCollapsed)}
              />

              {/* Content Area */}
              <div className="flex-1 flex gap-6 p-6 bg-muted/20">
                {/* Editor Panel */}
                <div className="flex-1 min-w-0 space-y-6">
                  {renderStepContent()}
                </div>

                {/* Live Preview Panel */}
                {!isCompactMode && (
                  <div className="w-80 xl:w-96">
                    <div className="sticky top-24">
                      <LivePreviewPanel
                        form={form}
                        categories={categories}
                        planningLayers={planningLayers}
                        domains={domains}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Bottom Navigation Bar */}
            <BottomNavigationBar
              currentStep={currentStep}
              totalSteps={steps.length}
              onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
              onNext={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              onSave={form.handleSubmit(onSubmit)}
              form={form}
              isLoading={isLoading_}
              isEditing={isEditing}
              lastSaved={lastSaved}
              autoSaveStatus={autoSaveStatus}
              className="h-16"
            />
          </form>
        </Form>
      </FormProvider>
    </div>
  );
};

export default EditKnowledgeItemRefactored;
