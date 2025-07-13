import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Users, ArrowRight } from 'lucide-react';
import { LearningPath } from '@/hooks/useLearningPaths';
import { DifficultyBadge } from './DifficultyBadge';

interface LearningPathCardProps {
  path: LearningPath;
  onStart?: () => void;
  onContinue?: () => void;
}

export const LearningPathCard: React.FC<LearningPathCardProps> = ({
  path,
  onStart,
  onContinue,
}) => {
  const progress = path.user_progress;
  const isStarted = progress && progress.status !== 'not_started';
  const isCompleted = progress?.status === 'completed';

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown duration';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };

  const getButtonText = () => {
    if (isCompleted) return 'Review Path';
    if (isStarted) return 'Continue Path';
    return 'Start Path';
  };

  const getButtonAction = () => {
    if (isStarted && onContinue) return onContinue;
    return onStart;
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg leading-tight">{path.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {path.difficulty_level && (
                <DifficultyBadge difficulty={path.difficulty_level} />
              )}
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {path.steps?.length || 0} steps
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(path.estimated_duration_minutes)}
              </Badge>
            </div>
          </div>
        </div>
        
        {path.description && (
          <CardDescription className="line-clamp-3">
            {path.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress.completion_percentage}%</span>
            </div>
            <Progress value={progress.completion_percentage} className="h-2" />
            {progress.status === 'paused' && (
              <Badge variant="outline" className="text-amber-600">
                Paused
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Learning Path</span>
          </div>
          
          <Button
            onClick={getButtonAction()}
            size="sm"
            variant={isCompleted ? "outline" : "default"}
            className="flex items-center gap-2"
          >
            {getButtonText()}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};