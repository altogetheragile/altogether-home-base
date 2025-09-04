import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  requiredFields?: (keyof KnowledgeItemFormData)[];
}

interface EnhancedFormStepperProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  form: UseFormReturn<any>;
  canNavigateToStep?: (step: number) => boolean;
  className?: string;
}

export const EnhancedFormStepper: React.FC<EnhancedFormStepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  form,
  canNavigateToStep = () => true,
  className
}) => {
  const { formState: { errors, touchedFields }, getValues, watch } = form;

  // Watch all form values for real-time completion tracking
  const formValues = watch();

  // Check if a step has errors
  const hasStepErrors = (step: StepConfig): boolean => {
    if (!step.requiredFields) return false;
    return step.requiredFields.some(field => errors[field]);
  };

  // Check if a step is completed (all required fields filled)
  const isStepCompleted = (step: StepConfig): boolean => {
    if (!step.requiredFields) return true;
    return step.requiredFields.every(field => {
      const value = formValues[field];
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
  };

  // Calculate completion percentage for each step
  const getStepCompletionPercentage = (step: StepConfig): number => {
    if (!step.requiredFields || step.requiredFields.length === 0) return 100;
    
    const completedFields = step.requiredFields.filter(field => {
      const value = formValues[field];
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
    
    return Math.round((completedFields.length / step.requiredFields.length) * 100);
  };

  // Calculate overall completion percentage
  const getOverallCompletion = (): number => {
    const allRequiredFields = steps.flatMap(step => step.requiredFields || []);
    if (allRequiredFields.length === 0) return 100;
    
    const completedFields = allRequiredFields.filter(field => {
      const value = formValues[field];
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
    
    return Math.round((completedFields.length / allRequiredFields.length) * 100);
  };

  const getStepStatus = (stepIndex: number): 'current' | 'completed' | 'error' | 'upcoming' => {
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) {
      return hasStepErrors(steps[stepIndex]) ? 'error' : 'completed';
    }
    return 'upcoming';
  };

  const overallCompletion = getOverallCompletion();

  return (
    <div className={cn(
      "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
      className
    )}>
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-6">
          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Knowledge Item Editor</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{overallCompletion}% Complete</span>
                {Object.keys(errors).length > 0 && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{Object.keys(errors).length} error(s)</span>
                  </div>
                )}
              </div>
            </div>
            <Progress value={overallCompletion} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = canNavigateToStep(index);
              const completion = getStepCompletionPercentage(step);
              
              return (
                <div key={step.id} className="flex items-center min-w-0">
                  <div className="flex flex-col items-center min-w-0">
                    <button
                      type="button"
                      onClick={() => isClickable && onStepChange(index)}
                      disabled={!isClickable}
                      className={cn(
                        "relative w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                        "border-2 border-transparent",
                        status === 'current' && "bg-primary text-primary-foreground border-primary shadow-lg scale-110",
                        status === 'completed' && "bg-green-500 text-white border-green-500",
                        status === 'error' && "bg-destructive text-destructive-foreground border-destructive",
                        status === 'upcoming' && "bg-muted text-muted-foreground border-muted-foreground/20",
                        isClickable && "hover:scale-105 cursor-pointer",
                        !isClickable && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {status === 'completed' ? (
                        <Check className="w-6 h-6" />
                      ) : status === 'error' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <div className="flex flex-col items-center">
                          {step.icon ? (
                            React.cloneElement(step.icon as React.ReactElement, { 
                              className: "w-5 h-5" 
                            })
                          ) : (
                            <span className="text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Completion ring for current/upcoming steps */}
                      {(status === 'current' || status === 'upcoming') && completion > 0 && completion < 100 && (
                        <svg className="absolute -inset-1 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle
                            cx="28"
                            cy="28"
                            r="26"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${completion * 1.63} 163`}
                            className="text-primary/30"
                          />
                        </svg>
                      )}
                    </button>
                    
                    <div className="mt-2 text-center min-w-0">
                      <div className={cn(
                        "text-xs font-medium truncate max-w-20",
                        status === 'current' && "text-primary",
                        status === 'completed' && "text-green-600",
                        status === 'error' && "text-destructive",
                        status === 'upcoming' && "text-muted-foreground"
                      )}>
                        {step.title}
                      </div>
                      {step.requiredFields && step.requiredFields.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {completion}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Step Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-20 h-0.5 mx-4 transition-colors",
                      index < currentStep ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Step Info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold">{steps[currentStep]?.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {steps[currentStep]?.description}
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="flex justify-between items-center mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onStepChange(currentStep - 1)}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => onStepChange(currentStep + 1)}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};