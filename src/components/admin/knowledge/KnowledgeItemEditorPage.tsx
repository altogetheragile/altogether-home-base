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
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Mutations
  const createMutation = useCreateKnowledgeItem();
  const updateMutation = useUpdateKnowledgeItem();

  // Data for dropdowns with error handling and retry
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useKnowledgeCategories();
  const { data: planningLayers = [], isLoading: layersLoading, error: layersError, refetch: refetchLayers } = usePlanningLayers();
  const { data: domains = [], isLoading: domainsLoading, error: domainsError, refetch: refetchDomains } = useActivityDomains();

  // Network error handling
  const hasNetworkErrors = categoriesError || layersError || domainsError;
  const isLoadingDropdownData = categoriesLoading || layersLoading || domainsLoading;

  // Form setup with proper type
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
    mode: 'onChange',
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Initialize form with existing data - only on first load or significant changes
  useEffect(() => {
    if (knowledgeItem && (!formInitialized || (!isEditing && knowledgeItem.id !== form.getValues('id'))) && !userIsTyping) {
      console.log('🔧 Initializing form with knowledge item data');
      const safeKnowledgeItem = {
        ...formDefaults,
        ...knowledgeItem,
        // Ensure arrays are properly initialized with fallbacks
        common_pitfalls: Array.isArray(knowledgeItem.common_pitfalls) ? knowledgeItem.common_pitfalls : [],
        evidence_sources: Array.isArray(knowledgeItem.evidence_sources) ? knowledgeItem.evidence_sources : [],
        related_techniques: Array.isArray(knowledgeItem.related_techniques) ? knowledgeItem.related_techniques : [],
        key_terminology: typeof knowledgeItem.key_terminology === 'object' && knowledgeItem.key_terminology !== null 
          ? knowledgeItem.key_terminology : {},
        // Ensure optional fields have proper fallbacks
        category_id: knowledgeItem.category_id || '',
        planning_layer_id: knowledgeItem.planning_layer_id || '',
        domain_id: knowledgeItem.domain_id || '',
        reference_url: knowledgeItem.reference_url || '',
        author: knowledgeItem.author || '',
        source: knowledgeItem.source || '',
        description: knowledgeItem.description || '',
        background: knowledgeItem.background || '',
        learning_value_summary: knowledgeItem.learning_value_summary || '',
      };
      
      form.reset(safeKnowledgeItem);
      setFormInitialized(true);
    }
  }, [knowledgeItem?.id, formInitialized, userIsTyping, isEditing]);

  // Track when user is actively typing to prevent form resets - improved version
  useEffect(() => {
    let typingTimeout: ReturnType<typeof setTimeout>;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('input, textarea, [contenteditable]')) {
        console.log('📝 User started typing');
        setUserIsTyping(true);
        
        // Clear any existing timeout
        clearTimeout(typingTimeout);
      }
    };
    
    const handleInput = () => {
      console.log('📝 User is typing');
      setUserIsTyping(true);
      
      // Clear any existing timeout and set a new one
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        console.log('📝 User stopped typing');
        setUserIsTyping(false);
      }, 1000); // User considered "stopped typing" after 1 second of inactivity
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('input, textarea, [contenteditable]')) {
        console.log('📝 User left field');
        
        // Set a short timeout to allow for quick field switches
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          setUserIsTyping(false);
        }, 500);
      }
    };

    // Add event listeners for all form inputs
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('input', handleInput);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('input', handleInput);
      clearTimeout(typingTimeout);
    };
  }, []);

  // TEMPORARILY DISABLE AUTO-SAVE TO FIX DATA VALIDATION ISSUES
  // const formValues = form.watch();
  // const debouncedFormValues = useDebounce(formValues, 5000);

  const performAutoSave = useCallback(async (data: KnowledgeItemFormData) => {
    console.log('🚫 Auto-save disabled temporarily for debugging');
    return;

    // More strict conditions to prevent infinite loops
    if (!form.formState.isDirty || !isEditing || !knowledgeItem?.id || userIsTyping || autoSaveStatus === 'saving') {
      console.log('🚫 Auto-save skipped:', { 
        isDirty: form.formState.isDirty, 
        isEditing, 
        hasId: !!knowledgeItem?.id, 
        userIsTyping,
        status: autoSaveStatus
      });
      return;
    }

    // Prevent auto-save if we just saved recently (cooldown period)
    if (lastAutoSave && Date.now() - lastAutoSave.getTime() < 2000) {
      console.log('🚫 Auto-save skipped: cooldown period active');
      return;
    }

    try {
      console.log('💾 Starting auto-save');
      setAutoSaveStatus('saving');
      setLastAutoSave(new Date());
      
      await updateMutation.mutateAsync({
        id: knowledgeItem.id,
        ...data,
      });
      
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      console.log('✅ Auto-save completed');
      
      // Clear saved status after a delay
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('❌ Auto-save failed:', error);
      
      // Clear error status after a delay
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    }
  }, [form.formState.isDirty, isEditing, knowledgeItem?.id, updateMutation, userIsTyping, autoSaveStatus, lastAutoSave]);

  useEffect(() => {
    // TEMPORARILY DISABLE AUTO-SAVE
    console.log('🚫 Auto-save useEffect disabled for debugging');
    return;
    
    // Only auto-save if form is dirty, user has stopped typing, and we're not already saving
    // if (debouncedFormValues && form.formState.isDirty && !userIsTyping && autoSaveStatus !== 'saving') {
    //   console.log('🕐 Debounced values changed, attempting auto-save');
    //   performAutoSave(debouncedFormValues);
    // }
  }, [performAutoSave]); // Simplified dependencies

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

  // Save handler with improved error handling and debugging
  const handleSave = async (shouldNavigateAway = false) => {
    console.log('🔍 handleSave called with shouldNavigateAway:', shouldNavigateAway);
    
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
        console.log('🔄 Updating knowledge item...');
        await updateMutation.mutateAsync({
          id: knowledgeItem.id,
          ...data,
        });
      } else {
        console.log('➕ Creating new knowledge item...');
        await createMutation.mutateAsync(data);
      }
      
      setLastSaved(new Date());
      
      // Reset form dirty state - mark current values as the new clean baseline
      form.reset(form.getValues());
      console.log('🧹 Form dirty state reset - isDirty:', form.formState.isDirty);
      
      // Only navigate away if explicitly requested
      if (shouldNavigateAway) {
        console.log('🚪 Navigating away as requested');
        navigate('/admin/knowledge/items');
      } else {
        console.log('✅ Save completed, staying on page');
      }
    } catch (error) {
      // Error handling is now done in the mutation hooks with better messages
      console.error('❌ Save failed in component:', error);
    }
  };

  // Separate handlers for clarity
  const handleSaveOnly = async () => {
    console.log('💾 Save Only button clicked');
    await handleSave(false);
  };

  const handleSaveAndClose = async () => {
    console.log('💾🚪 Save and Close button clicked');
    await handleSave(true);
  };

  const handleOpenPreview = () => {
    const formData = form.getValues();
    const knowledgeItemId = (formData as any).id || knowledgeItem?.id || 'new';
    
    // Store preview data in sessionStorage for the preview window to access
    sessionStorage.setItem('preview-knowledge-item', JSON.stringify(formData));
    
    // Open preview in new tab using the preview route
    const previewUrl = `/admin/knowledge/preview/${knowledgeItemId}`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
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

  // Network retry handler
  const handleRetryNetworkRequests = () => {
    if (categoriesError) refetchCategories();
    if (layersError) refetchLayers();
    if (domainsError) refetchDomains();
  };

  // Show network error notification if needed
  useEffect(() => {
    if (hasNetworkErrors) {
      toast({
        title: "Network Error",
        description: "Some dropdown data failed to load, but you can still edit the form. Click retry if needed.",
        variant: "destructive",
        action: (
          <button 
            onClick={handleRetryNetworkRequests}
            className="px-3 py-1 text-xs bg-destructive-foreground text-destructive rounded hover:bg-opacity-80"
          >
            Retry
          </button>
        ),
      });
    }
  }, [hasNetworkErrors, toast]);

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
        return <AnalyticsSection onStepChange={handleStepChange} />;
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
          onOpenPreview={handleOpenPreview}
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
              onSave={handleSaveOnly}
              onSaveAndClose={handleSaveAndClose}
              onOpenPreview={handleOpenPreview}
              isLoading={createMutation.isPending || updateMutation.isPending}
              isEditing={isEditing}
              lastSaved={lastSaved}
              autoSaveStatus={autoSaveStatus}
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
      </div>
    </FormProvider>
  );
}