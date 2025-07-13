import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Target, Trophy, Clock } from 'lucide-react';
import { useUserProgress } from '@/hooks/useUserProgress';
import { cn } from '@/lib/utils';

interface ReadingProgressProps {
  techniqueId: string;
  className?: string;
}

const statusConfig = {
  unread: {
    icon: BookOpen,
    label: 'Mark as Reading',
    nextStatus: 'reading' as const,
    color: 'bg-secondary text-secondary-foreground',
  },
  reading: {
    icon: CheckCircle,
    label: 'Mark as Read',
    nextStatus: 'read' as const,
    color: 'bg-blue-500 text-white',
  },
  read: {
    icon: Target,
    label: 'Mark as Applied',
    nextStatus: 'applied' as const,
    color: 'bg-green-500 text-white',
  },
  applied: {
    icon: Trophy,
    label: 'Mark as Mastered',
    nextStatus: 'mastered' as const,
    color: 'bg-purple-500 text-white',
  },
  mastered: {
    icon: Trophy,
    label: 'Mastered',
    nextStatus: 'mastered' as const,
    color: 'bg-amber-500 text-white',
  },
};

export const ReadingProgress: React.FC<ReadingProgressProps> = ({
  techniqueId,
  className,
}) => {
  const { progress, updateProgress, isUpdating } = useUserProgress(techniqueId);

  const currentStatus = progress?.status || 'unread';
  const config = statusConfig[currentStatus];
  const Icon = config.icon;

  const handleStatusUpdate = () => {
    if (currentStatus === 'mastered') return;
    updateProgress({
      techniqueId,
      status: config.nextStatus,
    });
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes === 0) return 'Just started';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        onClick={handleStatusUpdate}
        disabled={isUpdating || currentStatus === 'mastered'}
        variant={currentStatus === 'unread' ? 'outline' : 'default'}
        size="sm"
        className={cn(
          'transition-colors',
          currentStatus !== 'unread' && config.color
        )}
      >
        <Icon className="h-4 w-4 mr-2" />
        {config.label}
      </Button>

      {progress?.time_spent_seconds && progress.time_spent_seconds > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTimeSpent(progress.time_spent_seconds)}
        </Badge>
      )}

      {currentStatus !== 'unread' && (
        <Badge 
          variant="outline" 
          className={cn('capitalize', config.color)}
        >
          {currentStatus}
        </Badge>
      )}
    </div>
  );
};