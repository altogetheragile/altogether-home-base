import React from 'react';

/**
 * VerticalStepper displays the progress of the editor steps on the left-hand side. 
 * Each step is clickable to jump between sections.  The active step is highlighted.  
 */
interface Step {
  label: string;
}

interface VerticalStepperProps {
  steps: Step[];
  activeStep: number;
  setActiveStep: (index: number) => void;
}

export default function VerticalStepper({ steps, activeStep, setActiveStep }: VerticalStepperProps) {
  return (
    <nav style={{ padding: '1rem 0', width: '200px' }}>
      {steps.map((step, idx) => (
        <div
          key={step.label}
          onClick={() => setActiveStep(idx)}
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
          <span style={{ fontWeight: idx === activeStep ? 600 : 400 }}>{step.label}</span>
        </div>
      ))}
    </nav>
  );
}
