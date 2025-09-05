import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { knowledgeItemSchema, knowledgeItemDefaults, type KnowledgeItemFormData } from '@/schemas/knowledgeItem';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem, type KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

// Import layout components
import { CompactHeader } from './editor/CompactHeader';
import { VerticalStepper } from './editor/VerticalStepper';
import { BottomNavigationBar } from './editor/BottomNavigationBar';
import { LivePreviewPanel } from './editor/LivePreviewPanel';

// Import section components
import { BasicInfoSection } from './editor/sections/BasicInfoSection';
import { ClassificationSection } from './editor/sections/ClassificationSection';
import { ContentSection } from './editor/sections/ContentSection';
import { EnhancedSection } from './editor/sections/EnhancedSection';
import { UseCasesSection } from './editor/sections/UseCasesSection';
import { AnalyticsSection } from './editor/sections/AnalyticsSection';

// Import hooks for dropdown data
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningLayers } from '@/hooks/usePlanningLayers';
import { useActivityDomains } from '@/hooks/useActivityDomains';

interface KnowledgeItemEditorPageProps {
  knowledgeItem?: KnowledgeItem | null;
  isEditing?: boolean;
}

const stepConfigs = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Set the core details and publication settings',
    requiredFields: ['name', 'slug'] as (keyof KnowledgeItemFormData)[],
  },
  {
    id: 'classification',
    title: 'Classification',
    description: 'Categorize and organize this knowledge item',
    requiredFields: [] as (keyof KnowledgeItemFormData)[],
  },
  {
    id: 'content',
    title: 'Content',
    description: 'Add the main content and background information',
    requiredFields: [] as (keyof KnowledgeItemFormData)[],
  },
  {
    id: 'enhanced',
    title: 'Enhanced Details',
    description: 'Add advanced information, pitfalls, and terminology',
    requiredFields: [] as (keyof KnowledgeItemFormData)[],
  },
  {
    id: 'use-cases',
    title: 'Use Cases',
    description: 'Define practical applications and examples',
    requiredFields: [] as (keyof KnowledgeItemFormData)[],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    description: 'Review performance metrics and recommendations',
    requiredFields: [] as (keyof KnowledgeItemFormData)[],
  },
];

export function KnowledgeItemEditorPage({ knowledgeItem, isEditing = false }: KnowledgeItemEditorPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [stepperCollapsed, setStepperCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  // Mutations
  const createMutation = useCreateKnowledgeItem();
  const updateMutation = useUpdateKnowledgeItem();

  // Data for dropdowns
  const { data: categories = [] } = useKnowledgeCategories();
  const { data: planningLayers = [] } = usePlanningLayers();
  const { data: domains = [] } = useActivityDomains();

  // Form setup
  const formDefaults = {
    ...knowledgeItemDefaults,
    common_pitfalls: knowledgeItemDefaults.common_pitfalls || [],
    evidence_sources: knowledgeItemDefaults.evidence_sources || [],
    related_techniques: knowledgeItemDefaults.related_techniques || [],
    key_terminology: knowledgeItemDefaults.key_terminology || {},
  };

  const form = useForm<any>({
    resolver: zodResolver(knowledgeItemSchema),
    defaultValues: formDefaults,
    mode: 'onBlur',
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Initialize form with existing data
  useEffect(() => {
    if (knowledgeItem) {
      form.reset({
        ...formDefaults,
        ...knowledgeItem,
        // Ensure arrays are properly initialized
        common_pitfalls: knowledgeItem.common_pitfalls || [],
        evidence_sources: knowledgeItem.evidence_sources || [],
        related_techniques: knowledgeItem.related_techniques || [],
        key_terminology: knowledgeItem.key_terminology || {},
      });
    }
  }, [knowledgeItem, form]);

  // Auto-save functionality
  const formValues = form.watch();
  const debouncedFormValues = useDebounce(formValues, 3000);

  const performAutoSave = useCallback(async (data: KnowledgeItemFormData) => {
    if (!form.formState.isDirty || !isEditing || !knowledgeItem?.id) return;

    try {
      setAutoSaveStatus('saving');
      await updateMutation.mutateAsync({
        id: knowledgeItem.id,
        ...data,
      });
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      form.reset(data); // Reset dirty state
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  }, [form, isEditing, knowledgeItem?.id, updateMutation]);

  useEffect(() => {
    if (debouncedFormValues && form.formState.isDirty) {
      performAutoSave(debouncedFormValues);
    }
  }, [debouncedFormValues, performAutoSave, form.formState.isDirty]);

  // Navigation handlers
  const handleBack = () => {
    if (form.formState.isDirty) {
      const shouldLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!shouldLeave) return;
    }
    navigate('/admin/knowledge/items');
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < stepConfigs.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Save handler
  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }

    const data = form.getValues();
    
    try {
      if (isEditing && knowledgeItem?.id) {
        await updateMutation.mutateAsync({
          id: knowledgeItem.id,
          ...data,
        });
        toast({
          title: "Success",
          description: "Knowledge item updated successfully.",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: "Success",
          description: "Knowledge item created successfully.",
        });
      }
      
      setLastSaved(new Date());
      navigate('/admin/knowledge/items');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save knowledge item. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate completion percentage and error count
  const completionPercentage = Math.round(
    (stepConfigs.reduce((acc, step, index) => {
      if (index < currentStep) return acc + 100;
      if (index === currentStep) {
        const totalFields = step.requiredFields?.length || 1;
        const completedFields = step.requiredFields?.filter(field => {
          const value = form.watch(field);
          return typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null;
        }).length || 0;
        return acc + (completedFields / totalFields) * 100;
      }
      return acc;
    }, 0) / stepConfigs.length)
  );

  const errorCount = Object.keys(form.formState.errors).length;

  // Render current section
  const renderCurrentSection = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoSection />;
      case 1:
        return <ClassificationSection />;
      case 2:
        return <ContentSection knowledgeItemId={knowledgeItem?.id} />;
      case 3:
        return <EnhancedSection />;
      case 4:
        return <UseCasesSection />;
      case 5:
        return <AnalyticsSection />;
      default:
        return <BasicInfoSection />;
    }
  };

  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-background">
        {/* Compact Header */}
        <CompactHeader
          title={isEditing ? `Edit: ${knowledgeItem?.name || 'Knowledge Item'}` : 'Create Knowledge Item'}
          isEditing={isEditing}
          currentStep={currentStep}
          totalSteps={stepConfigs.length}
          completionPercentage={completionPercentage}
          errorCount={errorCount}
          onBack={handleBack}
          isCompactMode={isCompactMode}
          onToggleCompactMode={() => setIsCompactMode(!isCompactMode)}
        />

        {/* Main Layout */}
        <div className="flex h-[calc(100vh-73px)]">
          {/* Vertical Stepper Sidebar */}
          <VerticalStepper
            steps={stepConfigs}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            form={form}
            isCollapsed={stepperCollapsed}
            onToggleCollapsed={() => setStepperCollapsed(!stepperCollapsed)}
            onTogglePreview={() => setPreviewCollapsed(!previewCollapsed)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Content */}
            <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
              isCompactMode || previewCollapsed ? 'mr-0' : 'mr-80'
            }`}>
              <div className="p-6 pb-24 max-w-5xl mx-auto">
                <div className="bg-background border rounded-lg p-6 shadow-sm">
                  {renderCurrentSection()}
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            {!isCompactMode && !previewCollapsed && (
              <div className="w-80 border-l bg-muted/30 overflow-y-auto">
                <div className="p-4 sticky top-0">
                  <LivePreviewPanel
                    form={form as any}
                    categories={categories}
                    planningLayers={planningLayers}
                    domains={domains}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <BottomNavigationBar
          currentStep={currentStep}
          totalSteps={stepConfigs.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSave={handleSave}
          form={form}
          isLoading={isLoading}
          isEditing={isEditing}
          lastSaved={lastSaved}
          autoSaveStatus={autoSaveStatus}
        />
      </div>
    </FormProvider>
  );
}