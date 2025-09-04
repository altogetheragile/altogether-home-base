/*
  Summary of Issues and Proposed Improvements for Knowledge Item Admin Screen

  Issues:
  1. Duplicate fields across different tabs cause confusion and lead to inconsistent data entry.
  2. Each sub-form maintains its own slice of state, leading to fragmented validation and update logic.
  3. Nested dialogs (e.g. adding use cases) reset the parent tab because of internal state changes in Radix UI.

  Proposed Improvements:
  - Centralise form state management using a library like react-hook-form.  A single form context allows
    all sections to register inputs and share validation rules without duplication.
  - Replace the horizontal tabbed interface with a stepper or side navigation.  This provides a clearer
    progression through the sections (Basic Info → Classification → Content → Enhanced Info → Use Cases → Analytics)
    and avoids the problem of hidden tabs resetting when a child dialog opens.
  - Flatten nested dialogs by rendering secondary forms inline.  For example, embed the "Create Generic Use Case"
    form directly within the Use Cases step rather than as a separate modal.
  - Provide autosave/draft functionality and summarise validation errors across the entire form.

  The following component illustrates how these ideas can be applied.  It uses react-hook-form to manage
  state and a simple stepper to navigate between form sections.  Each section is separated into its own
  component that consumes the form context.  This is a simplified example and should be adapted to your
  actual UI library and styling guidelines.
*/

import React from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';

// Example section components.  In your codebase, these would contain your inputs
// for each part of the knowledge item.  Each input should register with the
// react-hook-form context using `register` and display validation errors.
function BasicInfoSection() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div>
      <h2>Basic Info</h2>
      <label>
        Name
        <input {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="error">{errors.name.message}</p>}
      </label>
      <label>
        Slug
        <input {...register('slug', { required: 'Slug is required' })} />
        {errors.slug && <p className="error">{errors.slug.message}</p>}
      </label>
      {/* Add other basic fields such as description */}
    </div>
  );
}

function ClassificationSection() {
  const { register } = useFormContext();
  return (
    <div>
      <h2>Classification</h2>
      <label>
        Category
        <select {...register('category_id')}>
          {/* options from your API */}
          <option value="">Select a category</option>
        </select>
      </label>
      <label>
        Planning Layer
        <select {...register('planning_layer_id')}>
          <option value="">Select a planning layer</option>
        </select>
      </label>
      <label>
        Domain
        <select {...register('domain_id')}>
          <option value="">Select a domain</option>
        </select>
      </label>
      {/* Add other classification fields such as tags */}
    </div>
  );
}

function ContentSection() {
  const { register } = useFormContext();
  return (
    <div>
      <h2>Content</h2>
      <label>
        Background
        <textarea {...register('background')} />
      </label>
      <label>
        Source
        <input {...register('source')} />
      </label>
      <label>
        Author
        <input {...register('author')} />
      </label>
      {/* Additional content fields such as references */}
    </div>
  );
}

function EnhancedSection() {
  const { register } = useFormContext();
  return (
    <div>
      <h2>Enhanced Info</h2>
      <label>
        Common Pitfalls
        <textarea {...register('common_pitfalls')} />
      </label>
      <label>
        Evidence Sources
        <textarea {...register('evidence_sources')} />
      </label>
      {/* Additional enhanced fields */}
    </div>
  );
}

function UseCasesSection() {
  // In a real application, you might map over existing use cases and allow
  // users to add new ones inline instead of opening a modal.
  return (
    <div>
      <h2>Use Cases</h2>
      <p>Add use cases here (inline form).</p>
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div>
      <h2>Analytics</h2>
      <p>Configure analytics here.</p>
    </div>
  );
}

// Define the step labels and corresponding components
const steps = [
  { label: 'Basic Info', component: BasicInfoSection },
  { label: 'Classification', component: ClassificationSection },
  { label: 'Content', component: ContentSection },
  { label: 'Enhanced Info', component: EnhancedSection },
  { label: 'Use Cases', component: UseCasesSection },
  { label: 'Analytics', component: AnalyticsSection },
];

export default function UnifiedKnowledgeItemForm() {
  const methods = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      background: '',
      source: '',
      author: '',
      category_id: '',
      planning_layer_id: '',
      domain_id: '',
      common_pitfalls: '',
      evidence_sources: '',
      // Add other default values
    },
  });

  const [activeStep, setActiveStep] = React.useState(0);

  const onSubmit = async (data) => {
    // Sanitize and persist data to your API (e.g. Supabase)
    console.log('Submitting form', data);
    // If you need to create or update, call your API here
  };

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const StepComponent = steps[activeStep].component;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {/* Simple step indicator */}
        <div style={{ display: 'flex', marginBottom: '1rem' }}>
          {steps.map((step, index) => (
            <div
              key={step.label}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderBottom: index === activeStep ? '2px solid #0070f3' : '1px solid #ccc',
                textAlign: 'center',
              }}
            >
              {step.label}
            </div>
          ))}
        </div>

        {/* Render the current step */}
        <StepComponent />

        {/* Navigation controls */}
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={prevStep} disabled={activeStep === 0}>
            Previous
          </button>
          {activeStep < steps.length - 1 ? (
            <button type="button" onClick={nextStep}>
              Next
            </button>
          ) : (
            <button type="submit">
              Save
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
