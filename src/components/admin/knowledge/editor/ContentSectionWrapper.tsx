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
      "transition-all duration-200",
      isActive ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              isActive ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {React.cloneElement(icon as React.ReactElement, { 
                className: "w-5 h-5" 
              })}
            </div>
          )}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  );
};