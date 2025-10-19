import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getConfidenceLevelLabel, getConfidenceLevelColor } from '@/utils/storyMetadata';

interface ConfidenceLevelBadgeProps {
  level: number;
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

export function ConfidenceLevelBadge({ 
  level, 
  showIcon = true,
  showLabel = true,
  variant = 'outline'
}: ConfidenceLevelBadgeProps) {
  const label = getConfidenceLevelLabel(level);
  const colorClass = getConfidenceLevelColor(level);
  
  const getIcon = () => {
    if (level >= 4) return <TrendingUp className="h-3 w-3" />;
    if (level <= 2) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getVariantClasses = () => {
    if (variant === 'outline') {
      if (level >= 5) return 'border-green-600 text-green-600 bg-green-50 dark:bg-green-950/20';
      if (level >= 4) return 'border-green-500 text-green-500 bg-green-50/50 dark:bg-green-950/10';
      if (level >= 3) return 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      if (level >= 2) return 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/20';
      return 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20';
    }
    return '';
  };

  return (
    <Badge 
      variant={variant}
      className={`inline-flex items-center gap-1.5 ${getVariantClasses()}`}
    >
      {showIcon && getIcon()}
      {showLabel && <span>Confidence: {label}</span>}
      {!showLabel && <span>{level}/5</span>}
    </Badge>
  );
}
