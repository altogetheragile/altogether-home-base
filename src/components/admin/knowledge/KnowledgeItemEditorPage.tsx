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
  const [previewWindow, setPreviewWindow] = useState<Window | null>(null);

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

  // Preview window functionality
  const openPreviewWindow = () => {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.focus();
      return;
    }

    const newWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes');
    if (newWindow) {
      setPreviewWindow(newWindow);
      updatePreviewWindow(newWindow, formValues);
    }
  };

  const updatePreviewWindow = (window: Window, data: any) => {
    if (!window || window.closed) return;
    
    // Store form data in the preview window's sessionStorage
    window.sessionStorage.setItem('previewData', JSON.stringify({
      formData: data,
      categories,
      planningLayers,
      domains
    }));
    
    // Create the preview window content
    const previewHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Knowledge Item Preview</title>
          <style>
            body { font-family: system-ui; padding: 20px; line-height: 1.6; background: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .title { font-size: 24px; font-weight: 600; margin-bottom: 12px; color: #1a1a1a; }
            .description { color: #666; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin: 2px; }
            .category { background: #e3f2fd; color: #1976d2; }
            .layer { background: #f3e5f5; color: #7b1fa2; }
            .domain { background: #e8f5e8; color: #388e3c; }
            .section { margin: 20px 0; }
            .section-title { font-weight: 600; margin-bottom: 8px; color: #333; }
            .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
            .meta-item { font-size: 14px; }
            .meta-label { font-weight: 500; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div id="preview-content">Loading preview...</div>
          </div>
          <script>
            function updatePreview() {
              const data = JSON.parse(sessionStorage.getItem('previewData') || '{}');
              const { formData = {}, categories = [], planningLayers = [], domains = [] } = data;
              
              const categoryName = categories.find(c => c.id === formData.category_id)?.name || '';
              const layerName = planningLayers.find(l => l.id === formData.planning_layer_id)?.name || '';
              const domainName = domains.find(d => d.id === formData.activity_domain_id)?.name || '';
              
              document.getElementById('preview-content').innerHTML = \`
                <div class="title">\${formData.name || 'Untitled Knowledge Item'}</div>
                <div class="description">\${formData.description || 'No description provided.'}</div>
                
                <div class="section">
                  \${categoryName ? \`<span class="badge category">\${categoryName}</span>\` : ''}
                  \${layerName ? \`<span class="badge layer">\${layerName}</span>\` : ''}
                  \${domainName ? \`<span class="badge domain">\${domainName}</span>\` : ''}
                </div>
                
                <div class="metadata">
                  <div class="meta-item">
                    <div class="meta-label">Status</div>
                    <div>\${formData.is_published ? 'Published' : 'Draft'}</div>
                  </div>
                  <div class="meta-item">
                    <div class="meta-label">Featured</div>
                    <div>\${formData.is_featured ? 'Yes' : 'No'}</div>
                  </div>
                  \${formData.author ? \`
                    <div class="meta-item">
                      <div class="meta-label">Author</div>
                      <div>\${formData.author}</div>
                    </div>
                  \` : ''}
                  \${formData.publication_year ? \`
                    <div class="meta-item">
                      <div class="meta-label">Publication Year</div>
                      <div>\${formData.publication_year}</div>
                    </div>
                  \` : ''}
                </div>
                
                \${formData.background ? \`
                  <div class="section">
                    <div class="section-title">Background</div>
                    <div>\${formData.background.substring(0, 200)}\${formData.background.length > 200 ? '...' : ''}</div>
                  </div>
                \` : ''}
                
                \${formData.learning_value_summary ? \`
                  <div class="section">
                    <div class="section-title">Learning Value</div>
                    <div>\${formData.learning_value_summary}</div>
                  </div>
                \` : ''}
              \`;
            }
            
            // Update preview on load
            updatePreview();
            
            // Listen for storage changes to update preview
            window.addEventListener('storage', updatePreview);
            
            // Poll for updates every 2 seconds
            setInterval(updatePreview, 2000);
          </script>
        </body>
      </html>
    `;
    
    window.document.open();
    window.document.write(previewHTML);
    window.document.close();
  };

  // Update preview window when form data changes
  useEffect(() => {
    if (previewWindow && !previewWindow.closed) {
      updatePreviewWindow(previewWindow, formValues);
    }
  }, [formValues, previewWindow, categories, planningLayers, domains]);

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
          onOpenPreview={openPreviewWindow}
        />

        {/* Main Layout */}
        <div className="flex h-[calc(100vh-64px)]">
          {/* Vertical Stepper Sidebar */}
          {!stepperCollapsed && (
            <VerticalStepper
              steps={stepConfigs}
              currentStep={currentStep}
              onStepChange={handleStepChange}
              form={form}
              isCollapsed={stepperCollapsed}
              onToggleCollapsed={() => setStepperCollapsed(!stepperCollapsed)}
              onOpenPreview={openPreviewWindow}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 pb-20">
              <div className="w-full">
                {renderCurrentSection()}
              </div>
            </div>
          </div>

          {/* Collapsed Stepper Toggle */}
          {stepperCollapsed && (
            <div className="fixed left-4 top-20 z-10">
              <button
                onClick={() => setStepperCollapsed(false)}
                className="p-2 bg-background border rounded-md shadow-sm hover:bg-muted"
                title="Show steps"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
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