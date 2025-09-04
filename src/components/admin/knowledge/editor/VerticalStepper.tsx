import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { KnowledgeItemFormData } from '@/schemas/knowledgeItem';

interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  requiredFields?: (keyof KnowledgeItemFormData)[];
}

interface VerticalStepperProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange: (step: number) => void;
  form: UseFormReturn<any>;
  canNavigateToStep?: (step: number) => boolean;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  className?: string;
}

export const VerticalStepper: React.FC<VerticalStepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  form,
  canNavigateToStep = () => true,
  isCollapsed = false,
  className
}) => {
  const { formState: { errors }, watch } = form;
  const formValues = watch();

  // Check if a step has errors
  const hasStepErrors = (step: StepConfig): boolean => {
    if (!step.requiredFields) return false;
    return step.requiredFields.some(field => errors[field]);
  };

  // Check if a step is completed
  const isStepCompleted = (step: StepConfig): boolean => {
    if (!step.requiredFields) return true;
    return step.requiredFields.every(field => {
      const value = formValues[field];
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
  };

  // Get completion percentage for a step
  const getStepCompletionPercentage = (step: StepConfig): number => {
    if (!step.requiredFields || step.requiredFields.length === 0) return 100;
    
    const completedFields = step.requiredFields.filter(field => {
      const value = formValues[field];
      if (typeof value === 'string') return value.trim() !== '';
      return value !== undefined && value !== null;
    });
    
    return Math.round((completedFields.length / step.requiredFields.length) * 100);
  };

  const getStepStatus = (stepIndex: number): 'current' | 'completed' | 'error' | 'upcoming' => {
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) {
      return hasStepErrors(steps[stepIndex]) ? 'error' : 'completed';
    }
    return 'upcoming';
  };

  return (
    <div className={cn(
      "flex flex-col bg-muted/30 border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center justify-between">
          <h2 className={cn(
            "font-semibold transition-opacity",
            isCollapsed ? "opacity-0 sr-only" : "opacity-100"
          )}>
            Steps
          </h2>
        </div>
      </div>

      {/* Steps */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = canNavigateToStep(index);
            const completion = getStepCompletionPercentage(step);
            const hasErrors = hasStepErrors(step);
            
            return (
              <div key={step.id} className="relative">
                <Button
                  variant="ghost"
                  onClick={() => isClickable && onStepChange(index)}
                  disabled={!isClickable}
                  className={cn(
                    "w-full justify-start p-3 mb-2 h-auto",
                    "transition-all duration-200 relative overflow-hidden",
                    status === 'current' && "bg-primary text-primary-foreground shadow-sm",
                    status === 'completed' && "bg-green-50 text-green-700 border-green-200",
                    status === 'error' && "bg-destructive/10 text-destructive border-destructive/20",
                    status === 'upcoming' && "hover:bg-muted/50",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Step Icon/Number */}
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                      status === 'current' && "bg-primary-foreground text-primary",
                      status === 'completed' && "bg-green-500 text-white",
                      status === 'error' && "bg-destructive text-destructive-foreground",
                      status === 'upcoming' && "bg-muted text-muted-foreground"
                    )}>
                      {status === 'completed' ? (
                        <Check className="w-4 h-4" />
                      ) : status === 'error' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        step.icon ? (
                          React.cloneElement(step.icon as React.ReactElement, { 
                            className: "w-4 h-4" 
                          })
                        ) : (
                          <span>{index + 1}</span>
                        )
                      )}
                    </div>

                    {/* Step Content */}
                    <div className={cn(
                      "flex-1 text-left min-w-0 transition-opacity",
                      isCollapsed ? "opacity-0 sr-only" : "opacity-100"
                    )}>
                      <div className="font-medium text-sm truncate">
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {step.description}
                      </div>
                      
                      {/* Progress indicator */}
                      {step.requiredFields && step.requiredFields.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-300",
                                  status === 'completed' && "bg-green-500",
                                  status === 'current' && "bg-primary-foreground",
                                  status === 'error' && "bg-destructive",
                                  status === 'upcoming' && "bg-primary/30"
                                )}
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {completion}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {status === 'current' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r" />
                  )}
                </Button>

                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    "absolute left-6 top-14 w-px h-4 transition-colors",
                    index < currentStep ? "bg-green-500" : "bg-muted",
                    isCollapsed && "opacity-0"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};