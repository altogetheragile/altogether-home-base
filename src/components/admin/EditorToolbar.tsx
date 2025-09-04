import React from 'react';

/**
 * EditorToolbar combines back navigation, the page title and step counter into a single horizontal bar. 
 * It replaces the large header on the existing Knowledge Item editor and helps reduce vertical clutter. 
 */
interface EditorToolbarProps {
  /**
   * The current step number (1‑based).  Use this prop when passing the
   * current step explicitly.
   */
  currentStep?: number;
  /**
   * The zero‑based step index.  For backwards compatibility, either
   * `currentStep` or `stepIndex` may be supplied.  If both are provided,
   * `currentStep` takes precedence.
   */
  stepIndex?: number;
  /** Total number of steps in the editor. */
  totalSteps: number;
  /** Callback fired when the back button is clicked. */
  onBack: () => void;
}

export default function EditorToolbar({ currentStep, stepIndex, totalSteps, onBack }: EditorToolbarProps) {
  // Normalize the step number.  Prefer currentStep if provided; otherwise
  // convert the zero‑based stepIndex to a 1‑based number.  Default to 1
  // if neither prop is passed.
  const stepNumber = currentStep ?? ((stepIndex ?? 0) + 1);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
      }}
    >
      <button onClick={onBack} style={{ marginRight: '1rem' }}>
        ← Back
      </button>
      <h2 style={{ flex: 1, margin: 0 }}>Edit Knowledge Item</h2>
      <span>
        Step {stepNumber} / {totalSteps}
      </span>
    </div>
  );
}
