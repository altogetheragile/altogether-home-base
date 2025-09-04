import React from 'react';

/**
 * VerticalStepper displays the progress of the editor steps on the left-hand side. 
 * Each step is clickable to jump between sections.  The active step is highlighted.  
 */
// VerticalStepper receives a list of step labels and renders a clickable list
// along the left-hand side of the editor.  When a step is clicked, it calls
// the provided onStepClick handler with the index of the step.  This API
// aligns with the improved KnowledgeItem editor, which passes a string array
// and an onStepClick callback.

interface VerticalStepperProps {
  /**
   * An array of step labels to display.  Each string represents the name of a step.
   */
  steps: string[];
  /**
   * The index of the currently active step.  The active step will be highlighted.
   */
  activeStep: number;
  /**
   * Callback fired when the user clicks a step.  Receives the index of the clicked step.
   */
  onStepClick: (index: number) => void;
}

export default function VerticalStepper({ steps, activeStep, onStepClick }: VerticalStepperProps) {
  return (
    <nav style={{ padding: '1rem 0', width: '200px' }}>
      {steps.map((label, idx) => (
        <div
          key={label}
          onClick={() => onStepClick(idx)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            backgroundColor: idx === activeStep ? '#f3f4f6' : 'transparent',
            borderLeft: idx === activeStep ? '4px solid #f97316' : '4px solid transparent',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: idx === activeStep ? '#f97316' : '#e5e7eb',
              color: idx === activeStep ? '#fff' : '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              marginRight: '0.75rem',
            }}
          >
            {idx + 1}
          </div>
          <span style={{ fontWeight: idx === activeStep ? 600 : 400 }}>{label}</span>
        </div>
      ))}
    </nav>
  );
}
