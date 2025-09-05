import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { knowledgeItemSchema, knowledgeItemDefaults, type KnowledgeItemFormData } from '@/schemas/knowledgeItem';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem, type KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useToast } from '@/hooks/use-toast';

// Import the step components
import { FormStepper } from './editor/FormStepper';
import { BottomNavigationBar } from './editor/BottomNavigationBar';
import { BasicInfoSection } from './editor/sections/BasicInfoSection';
import { ClassificationSection } from './editor/sections/ClassificationSection';
import { ContentSection } from './editor/sections/ContentSection';
import { EnhancedSection } from './editor/sections/EnhancedSection';

export type KnowledgeItemEditorProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  knowledgeItem: KnowledgeItem | null;
  onSuccess: () => void;
};

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
];

export function KnowledgeItemEditor({
  open,
  onOpenChange,
  knowledgeItem,
  onSuccess,
}: KnowledgeItemEditorProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const createMutation = useCreateKnowledgeItem();
  const updateMutation = useUpdateKnowledgeItem();

  // Create form with proper defaults to handle schema/component mismatch
  const formDefaults = {
    ...knowledgeItemDefaults,
    // Ensure arrays are initialized properly for the enhanced section
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
    if (knowledgeItem && open) {
      const formData = {
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
        common_pitfalls: knowledgeItem.common_pitfalls || [],
        evidence_sources: knowledgeItem.evidence_sources || [],
        related_techniques: knowledgeItem.related_techniques || [],
        learning_value_summary: knowledgeItem.learning_value_summary || '',
        key_terminology: knowledgeItem.key_terminology || {},
        is_published: knowledgeItem.is_published ?? false,
        is_featured: knowledgeItem.is_featured ?? false,
      };
      form.reset(formData);
    } else if (open && !knowledgeItem) {
      form.reset(formDefaults);
    }
  }, [knowledgeItem, open, form, formDefaults]);

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setLastSaved(undefined);
      setAutoSaveStatus('idle');
    }
  }, [open]);

  const handleStepChange = (step: number) => {
    if (step >= 0 && step < stepConfigs.length) {
      setCurrentStep(step);
    }
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

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    setAutoSaveStatus('saving');
    
    try {
      const formData = form.getValues();
      
      // Clean up the data - remove empty strings and convert to proper types
      const cleanData = {
        ...formData,
        description: formData.description || undefined,
        background: formData.background || undefined,
        source: formData.source || undefined,
        author: formData.author || undefined,
        reference_url: formData.reference_url || undefined,
        category_id: formData.category_id || undefined,
        planning_layer_id: formData.planning_layer_id || undefined,
        domain_id: formData.domain_id || undefined,
        learning_value_summary: formData.learning_value_summary || undefined,
        // Filter out empty array items
        common_pitfalls: (formData.common_pitfalls || []).filter((item: string) => item.trim()),
        evidence_sources: (formData.evidence_sources || []).filter((item: string) => item.trim()),
        related_techniques: (formData.related_techniques || []).filter((item: string) => item.trim()),
        // Filter out empty terminology entries
        key_terminology: Object.fromEntries(
          Object.entries(formData.key_terminology || {})
            .filter(([key, value]) => key.trim() && (value as string).trim())
        ),
      };

      if (knowledgeItem?.id) {
        await updateMutation.mutateAsync({
          id: knowledgeItem.id,
          ...cleanData,
        });
      } else {
        await createMutation.mutateAsync(cleanData);
      }
      
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      setAutoSaveStatus('error');
      // Error handling is done in the mutations
    }
  };

  const canNavigateToStep = (step: number) => {
    // Allow navigation to current step and previous steps
    // For next steps, check if current step is valid
    if (step <= currentStep) return true;
    
    // For future steps, check if all previous required fields are filled
    for (let i = 0; i < step; i++) {
      const stepConfig = stepConfigs[i];
      if (stepConfig.requiredFields?.length) {
        const values = form.getValues();
        const hasErrors = stepConfig.requiredFields.some(field => {
          const value = values[field];
          if (typeof value === 'string') return !value.trim();
          return value === undefined || value === null;
        });
        if (hasErrors) return false;
      }
    }
    
    return true;
  };

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
      default:
        return <BasicInfoSection />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {knowledgeItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <FormProvider {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col">
              {/* Step Navigation */}
              <div className="px-6 py-4 border-b">
                <FormStepper
                  steps={stepConfigs}
                  currentStep={currentStep}
                  onStepChange={handleStepChange}
                  form={form}
                  canNavigateToStep={canNavigateToStep}
                />
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {renderCurrentSection()}
              </div>

              {/* Bottom Navigation */}
              <div className="border-t">
                <BottomNavigationBar
                  currentStep={currentStep}
                  totalSteps={stepConfigs.length}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onSave={handleSave}
                  form={form}
                  isLoading={isLoading}
                  isEditing={!!knowledgeItem}
                  lastSaved={lastSaved}
                  autoSaveStatus={autoSaveStatus}
                  className="px-6 py-4"
                />
              </div>
            </form>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}