import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import FocusBar from './FocusBar';
import EditorToolbar from './EditorToolbar';
import VerticalStepper from './VerticalStepper';

// These placeholder section components should be replaced with your actual form components.
function BasicInfoSection() {
  // Use useFormContext() if you need to register inputs for react-hook-form
  return (
    <div>
      <h3>Basic Information</h3>
      {/* Insert your Basic Info fields here */}
    </div>
  );
}
function ClassificationSection() {
  return (
    <div>
      <h3>Classification</h3>
      {/* Classification fields */}
    </div>
  );
}
function ContentSection() {
  return (
    <div>
      <h3>Content</h3>
      {/* Content fields */}
    </div>
  );
}
function EnhancedInfoSection() {
  return (
    <div>
      <h3>Enhanced Info</h3>
      {/* Enhanced Info fields */}
    </div>
  );
}
function UseCasesSection() {
  return (
    <div>
      <h3>Use Cases</h3>
      {/* Use Cases fields */}
    </div>
  );
}
function AnalyticsSection() {
  return (
    <div>
      <h3>Analytics</h3>
      {/* Analytics fields */}
    </div>
  );
}

/**
 * Main improved Knowledge Item editor component.  
 * Combines a compressed toolbar, vertical stepper and card-based section layout.  
 */
export default function KnowledgeItemEditorImproved() {
  // Create a react-hook-form context to manage all fields in a unified way.
  const methods = useForm({
    defaultValues: {
      // Provide your default values here
      name: '',
      slug: '',
      description: '',
    },
  });

  // Define the steps of the editor; each step uses a separate component.
  const steps = [
    { label: 'Basic Info', component: BasicInfoSection },
    { label: 'Classification', component: ClassificationSection },
    { label: 'Content', component: ContentSection },
    { label: 'Enhanced Info', component: EnhancedInfoSection },
    { label: 'Use Cases', component: UseCasesSection },
    { label: 'Analytics', component: AnalyticsSection },
  ];

  const [activeStep, setActiveStep] = useState(0);
  const totalSteps = steps.length;

  // Determine which section to show for the current step.
  const CurrentSection = steps[activeStep].component;

  // Handler for navigating back to the list of knowledge items.
  const handleBack = () => {
    // Use your router here to navigate back, e.g. router.push('/admin/knowledge/items');
  };

  // Handler for submitting the form on the final step.
  const handleSubmit = (data: any) => {
    // Send data to your API to create or update the knowledge item.
    console.log('Form data', data);
  };

  return (
    <FocusBar>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>
          {/* Slim toolbar with Back button and step counter */}
          <EditorToolbar
            stepIndex={activeStep}
            totalSteps={totalSteps}
            onBack={handleBack}
          />
          <div style={{ display: 'flex', minHeight: 'calc(100vh - 48px)' }}>
            {/* Vertical stepper on the left */}
            <VerticalStepper
              steps={steps}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
            />

            {/* Form content with card layout */}
            <main style={{ flex: 1, padding: '1rem', backgroundColor: '#f9fafb' }}>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <CurrentSection />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => s - 1)}
                >
                  Previous
                </button>
                {activeStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((s) => s + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <button type="submit">Save</button>
                )}
              </div>
            </main>
          </div>
        </form>
      </FormProvider>
    </FocusBar>
  );
}
