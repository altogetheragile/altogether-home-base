import React from 'react';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Eye, Clock, CheckCircle2, AlertCircle, Loader2, ChevronRight, FileText, Hash, Palette, BookOpen, Lightbulb, BarChart3 } from 'lucide-react';
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
  onSaveAndClose?: () => void;
  onOpenPreview: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  lastSaved?: Date;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

const stepIcons = [
  FileText,    // Basic Info
  Hash,        // Classification
  BookOpen,    // Content
  Lightbulb,   // Enhanced
  Palette,     // Use Cases
  BarChart3,   // Analytics
];

export const VerticalStepper: React.FC<VerticalStepperProps> = ({
  steps,
  currentStep,
  onStepChange,
  canNavigateToStep = () => true,
  form,
  isCollapsed,
  onToggleCollapsed,
  onSave,
  onSaveAndClose,
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
    if (stepIndex < currentStep && isStepCompleted(steps[stepIndex])) return 'completed';
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
          <div className="flex items-center gap-1.5 text-primary text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-green-600 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>Saved {lastSaved ? formatLastSaved(lastSaved) : ''}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-destructive text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>Save failed</span>
          </div>
        );
      default:
        return lastSaved ? (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Clock className="h-3 w-3" />
            <span>Last saved {formatLastSaved(lastSaved)}</span>
          </div>
        ) : null;
    }
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-col h-full bg-card border-r border-border/50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-80"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sm text-foreground">Progress</h2>
              <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
            className="h-8 w-8 p-0 hover:bg-accent/50"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Steps */}
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = canNavigateToStep(index);
              const completion = getStepCompletionPercentage(step);
              const StepIcon = stepIcons[index] || FileText;
              
              return (
                <div key={step.id} className="relative">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => isClickable && onStepChange(index)}
                        disabled={!isClickable}
                        className={cn(
                          "w-full justify-start p-3 h-auto transition-all duration-200 relative group",
                          "hover:bg-accent/50 rounded-lg",
                          status === 'current' && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                          status === 'completed' && "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200/50",
                          status === 'error' && "bg-destructive/10 text-destructive hover:bg-destructive/15 border border-destructive/20",
                          !isClickable && "cursor-not-allowed opacity-50",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <div className={cn(
                          "flex items-start gap-3 w-full", 
                          isCollapsed && "justify-center"
                        )}>
                          {/* Step Icon */}
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            status === 'current' && "bg-primary-foreground text-primary",
                            status === 'completed' && "bg-green-500 text-white",
                            status === 'error' && "bg-destructive text-destructive-foreground",
                            status === 'upcoming' && "bg-muted text-muted-foreground group-hover:bg-accent"
                          )}>
                            {status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : status === 'error' ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : (
                              <StepIcon className="w-4 h-4" />
                            )}
                          </div>

                          {/* Step Content - Hidden when collapsed */}
                          {!isCollapsed && (
                            <div className="flex-1 text-left min-w-0">
                              <div className="font-medium text-sm leading-tight mb-1">
                                {step.title}
                              </div>
                              
                              {/* Progress indicator */}
                              {step.requiredFields && step.requiredFields.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex-1 h-1.5 bg-background/20 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full transition-all duration-300 rounded-full",
                                        status === 'completed' && "bg-green-400",
                                        status === 'current' && "bg-primary-foreground",
                                        status === 'error' && "bg-destructive",
                                        status === 'upcoming' && "bg-primary/30"
                                      )}
                                      style={{ width: `${completion}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-current/70 font-medium">
                                    {completion}%
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side={isCollapsed ? "right" : "top"} className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        {step.requiredFields && step.requiredFields.length > 0 && (
                          <p className="text-xs">Progress: {getStepCompletionPercentage(step)}%</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Connection line */}
                  {!isCollapsed && index < steps.length - 1 && (
                    <div className={cn(
                      "absolute left-6 top-12 w-px h-4 transition-colors",
                      index < currentStep ? "bg-green-400" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="border-t border-border/50 p-4 space-y-3 bg-muted/10">
          {/* Status Indicators - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errorCount} error{errorCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  
                  {isDirty && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-amber-200 text-amber-600">
                      Unsaved
                    </Badge>
                  )}
                  
                  {isValid && !errorCount && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  )}
                </div>
              </div>

              {/* Auto-save Status */}
              {getAutoSaveIndicator() && (
                <div className="flex justify-center py-1">
                  {getAutoSaveIndicator()}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onSave}
              disabled={isLoading || (!isDirty && isEditing)}
              className={cn(
                "w-full flex items-center gap-2 h-9",
                isCollapsed && "px-2"
              )}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {!isCollapsed && (isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Item'))}
            </Button>

            {!isCollapsed && isEditing && onSaveAndClose && (
              <Button
                variant="outline"
                onClick={onSaveAndClose}
                disabled={isLoading}
                className="w-full flex items-center gap-2 h-9"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save & Close
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onOpenPreview}
              className={cn(
                "w-full flex items-center gap-2 h-9 hover:bg-accent/50",
                isCollapsed && "px-2"
              )}
              size="sm"
            >
              <Eye className="h-4 w-4" />
              {!isCollapsed && "Preview"}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};