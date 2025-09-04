import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  requiredFields?: (keyof KnowledgeItemFormData)[];
}

interface FormStepperProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  form: UseFormReturn<any>;
  canNavigateToStep?: (step: number) => boolean;
}

export const FormStepper: React.FC<FormStepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  form,
  canNavigateToStep = () => true,
}) => {
  const { formState: { errors, touchedFields }, getValues } = form;

  // Check if a step has errors
  const hasStepErrors = (step: StepConfig): boolean => {
    if (!step.requiredFields) return false;
    return step.requiredFields.some(field => errors[field]);
  };

  // Check if a step is completed (all required fields filled)
  const isStepCompleted = (step: StepConfig): boolean => {
    if (!step.requiredFields) return true;
    const values = getValues();
    return step.requiredFields.every(field => {
      const value = values[field];
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
  };

  const getStepStatus = (stepIndex: number): 'current' | 'completed' | 'error' | 'upcoming' => {
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) {
      return hasStepErrors(steps[stepIndex]) ? 'error' : 'completed';
    }
    return 'upcoming';
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = canNavigateToStep(index);
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepChange(index)}
                  disabled={!isClickable}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    status === 'current' && "bg-primary text-primary-foreground",
                    status === 'completed' && "bg-green-500 text-white",
                    status === 'error' && "bg-destructive text-destructive-foreground",
                    status === 'upcoming' && "bg-muted text-muted-foreground",
                    isClickable && "hover:bg-primary/80 cursor-pointer",
                    !isClickable && "cursor-not-allowed"
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                
                {/* Step Connector Line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-20 h-0.5 mx-2",
                    index < currentStep ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Info */}
        <div className="text-center">
          <h2 className="text-xl font-semibold">{steps[currentStep]?.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {steps[currentStep]?.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onStepChange(currentStep - 1)}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>

          <Button
            type="button"
            onClick={() => onStepChange(currentStep + 1)}
            disabled={currentStep === steps.length - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Validation Errors Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="text-sm font-medium text-destructive mb-2">Please fix the following errors:</h4>
            <ul className="text-sm text-destructive/80 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {(error as any)?.message || 'Invalid field'}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};