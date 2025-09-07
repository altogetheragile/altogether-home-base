import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ContentSectionWrapperProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export const ContentSectionWrapper: React.FC<ContentSectionWrapperProps> = ({
  title,
  description,
  icon,
  children,
  isActive = false,
  className
}) => {
  return (
    <Card className={cn(
      "transition-all duration-300 ease-in-out",
      isActive 
        ? "ring-2 ring-primary shadow-card-focus bg-primary/2" 
        : "shadow-card hover:shadow-card-hover",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {icon && (
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-200",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted/80 text-muted-foreground"
            )}>
              {React.cloneElement(icon as React.ReactElement, { 
                className: "w-5 h-5" 
              })}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold tracking-tight mb-1">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {children}
      </CardContent>
    </Card>
  );
};