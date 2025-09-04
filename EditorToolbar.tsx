import React from 'react';

/**
 * EditorToolbar combines back navigation, the page title and step counter into a single horizontal bar. 
 * It replaces the large header on the existing Knowledge Item editor and helps reduce vertical clutter. 
 */
interface EditorToolbarProps {
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
}

export default function EditorToolbar({ stepIndex, totalSteps, onBack }: EditorToolbarProps) {
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
        Step {stepIndex + 1} / {totalSteps}
      </span>
    </div>
  );
}
