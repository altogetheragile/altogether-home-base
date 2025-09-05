import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface BottomNavigationBarProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  onSaveAndClose?: () => void;
  form: UseFormReturn<any>;
  isLoading?: boolean;
  isEditing?: boolean;
  lastSaved?: Date;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  className?: string;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSave,
  onSaveAndClose,
  form,
  isLoading = false,
  isEditing = false,
  lastSaved,
  autoSaveStatus = 'idle',
  className
}) => {
  const { formState: { errors, isDirty, isValid } } = form;
  const errorCount = Object.keys(errors).length;

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
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t",
      className
    )}>
      <Card className="rounded-none border-x-0 border-b-0">
        <CardContent className="py-3 px-6">
          <div className="flex items-center justify-between">
            {/* Left: Navigation */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={currentStep === 0 || isLoading}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                
                {/* Step indicators */}
                <div className="flex gap-1">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        i === currentStep ? "bg-primary" : 
                        i < currentStep ? "bg-primary/60" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Center: Status Indicators */}
            <div className="flex items-center gap-4">
              {/* Form Status */}
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

              {/* Auto-save Status */}
              {getAutoSaveIndicator()}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {currentStep < totalSteps - 1 ? (
                <Button
                  type="button"
                  onClick={onNext}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSave}
                    disabled={isLoading || (!isDirty && isEditing)}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Item')}
                  </Button>
                  
                  {isEditing && onSaveAndClose && (
                    <Button
                      type="button"
                      onClick={onSaveAndClose}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save & Close
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};