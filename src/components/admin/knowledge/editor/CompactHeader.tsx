import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Eye, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactHeaderProps {
  title: string;
  isEditing?: boolean;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  errorCount: number;
  onBack: () => void;
  isCompactMode?: boolean;
  onToggleCompactMode?: () => void;
  onOpenPreview?: () => void;
  className?: string;
  returnTo?: string | null;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  title,
  isEditing = false,
  currentStep,
  totalSteps,
  completionPercentage,
  errorCount,
  onBack,
  isCompactMode = false,
  onToggleCompactMode,
  onOpenPreview,
  className,
  returnTo
}) => {
  const stepConfigs = [
    'Basic Info',
    'Classification', 
    'Content',
    'Enhanced',
    'Use Cases',
    'Analytics'
  ];

  return (
    <div className={cn(
      "sticky top-0 z-50 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/90 border-b border-border/50 shadow-sm",
      className
    )}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Navigation */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="hover:bg-accent/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {returnTo === 'project-model' ? 'Back to Project Model' : 'Back'}
            </Button>
            <div className="h-5 w-px bg-border/60" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {stepConfigs[currentStep] || 'Knowledge Item Editor'}
              </p>
            </div>
          </div>

          {/* Center: Enhanced Progress */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span>Step {currentStep + 1} of {totalSteps}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-24 h-2 bg-muted/60 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-primary">{completionPercentage}%</span>
                  {completionPercentage === 100 && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>
            
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-xs font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errorCount} error{errorCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {onOpenPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenPreview}
                className="hover:bg-accent/50 border-border/60"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};