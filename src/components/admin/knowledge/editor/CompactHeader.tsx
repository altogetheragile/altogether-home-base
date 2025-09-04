import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Menu, Minimize2, Maximize2 } from 'lucide-react';
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
  className?: string;
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
  className
}) => {
  return (
    <div className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b",
      className
    )}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold truncate">
            {title}
          </h1>
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {currentStep + 1}/{totalSteps}</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span>{completionPercentage}%</span>
          </div>
          
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onToggleCompactMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCompactMode}
              title={isCompactMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isCompactMode ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};