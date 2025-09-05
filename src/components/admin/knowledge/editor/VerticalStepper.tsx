import React from 'react';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, ExternalLink, Clock, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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
  onStepChange: (stepIndex: number) => void;
  canNavigateToStep?: (stepIndex: number) => boolean;
  form: UseFormReturn<any>;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onSave: () => void;
  onOpenPreview: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  lastSaved?: Date;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export const VerticalStepper: React.FC<VerticalStepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  canNavigateToStep = () => true,
  form,
  isCollapsed,
  onToggleCollapsed,
  onSave,
  onOpenPreview,
  isLoading = false,
  isEditing = false,
  lastSaved,
  autoSaveStatus = 'idle',
}) => {
  const { formState: { errors, isDirty, isValid } } = form;
  const errorCount = Object.keys(errors).length;

  const formValues = form.watch();

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
    
    if (hasStepErrors(steps[stepIndex])) return 'error';
    
    if (stepIndex < currentStep && isStepCompleted(steps[stepIndex])) {
      return 'completed';
    }
    
    return 'upcoming';
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-xs">
              Saved {lastSaved ? formatLastSaved(lastSaved) : ''}
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">Save failed</span>
          </div>
        );
      default:
        return lastSaved ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Last saved {formatLastSaved(lastSaved)}</span>
          </div>
        ) : null;
    }
  };

  return (
    <TooltipProvider>
      <Collapsible open={!isCollapsed} onOpenChange={onToggleCollapsed}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-center p-2 h-auto border-b"
        >
          <span className={cn(
            "font-medium text-sm",
            !isCollapsed ? "sr-only" : ""
          )}>
            Steps
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className={cn(
        "flex flex-col bg-muted/30 border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-80"
      )}>
        {/* Header */}
        <div className="p-4 border-b bg-background/50">
          <h2 className="font-semibold">Progress & Actions</h2>
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
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isClickable) {
                        onStepChange(index);
                      }
                    }}
                    disabled={!isClickable}
                    className={cn(
                      "w-full justify-start p-3 mb-2 h-auto min-h-[4rem]",
                      "transition-all duration-200 relative overflow-visible",
                      status === 'current' && "bg-primary text-primary-foreground shadow-sm",
                      status === 'completed' && "bg-green-50 text-green-700 border border-green-200",
                      status === 'error' && "bg-destructive/10 text-destructive border border-destructive/20",
                      status === 'upcoming' && "hover:bg-muted/50",
                      !isClickable && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {/* Step Icon/Number */}
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        status === 'current' && "bg-primary-foreground text-primary",
                        status === 'completed' && "bg-green-500 text-white",
                        status === 'error' && "bg-destructive text-destructive-foreground",
                        status === 'upcoming' && "bg-muted text-muted-foreground"
                      )}>
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
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
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm leading-tight">
                            {step.title}
                          </div>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <button 
                                type="button"
                                className="inline-flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs z-50">
                              <p className="text-sm">{step.description}</p>
                            </TooltipContent>
                          </Tooltip>
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
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full" />
                    )}
                  </Button>

                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "absolute left-6 top-14 w-px h-4 transition-colors",
                      index < currentStep ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Action Buttons - Always visible */}
        <div className="border-t pt-4 p-4 space-y-3">
          {/* Status Indicators */}
          <div className="space-y-2">
            {/* Form Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errorCount} error{errorCount > 1 ? 's' : ''}
                  </Badge>
                )}
                
                {isDirty && (
                  <Badge variant="outline" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
                
                {isValid && !errorCount && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                )}
              </div>
            </div>

            {/* Auto-save Status */}
            {getAutoSaveIndicator() && (
              <div className="flex justify-center">
                {getAutoSaveIndicator()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={isLoading || (!isDirty && isEditing)}
              className="w-full flex items-center gap-2"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Item')}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onOpenPreview}
              className="w-full flex items-center gap-2"
              size="sm"
            >
              <ExternalLink className="h-4 w-4" />
              Preview in New Tab
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
    </TooltipProvider>
  );
};