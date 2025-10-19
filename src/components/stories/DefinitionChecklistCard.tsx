import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';

interface ChecklistItem {
  label: string;
  checked: boolean;
}

interface DefinitionChecklistCardProps {
  title: string;
  description?: string;
  items: ChecklistItem[];
  onToggle?: (index: number) => void;
  readonly?: boolean;
  showProgress?: boolean;
}

export function DefinitionChecklistCard({
  title,
  description,
  items,
  onToggle,
  readonly = false,
  showProgress = true
}: DefinitionChecklistCardProps) {
  const completedCount = items.filter(item => item.checked).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  return (
    <Card className={isComplete ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/10' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
          {showProgress && (
            <span className="text-xs font-medium text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {showProgress && (
          <Progress 
            value={percentage} 
            className={`h-1.5 ${isComplete ? 'bg-green-200' : ''}`}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No items defined</p>
        ) : (
          items.map((item, index) => (
            <div 
              key={index}
              className="flex items-start space-x-2 rounded-md p-2 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={`${title}-${index}`}
                checked={item.checked}
                onCheckedChange={() => onToggle?.(index)}
                disabled={readonly}
                className="mt-0.5"
              />
              <label
                htmlFor={`${title}-${index}`}
                className={`text-sm leading-relaxed cursor-pointer select-none flex-1 ${
                  item.checked ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {item.label}
              </label>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
