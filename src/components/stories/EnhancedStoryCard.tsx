import React, { useState } from 'react';
import { UserStory } from '@/hooks/useUserStories';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StoryMetadataPanel } from './StoryMetadataPanel';
import { ConfidenceLevelBadge } from './ConfidenceLevelBadge';
import { ImpactEffortMatrix } from './ImpactEffortMatrix';
import { DefinitionChecklistCard } from './DefinitionChecklistCard';
import { calculateReadiness, calculateCompletion } from '@/utils/storyMetadata';
import {
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  User,
  Tag
} from 'lucide-react';

interface EnhancedStoryCardProps {
  story: UserStory;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpdate?: (updates: Partial<UserStory>) => void;
  showMetadata?: boolean;
  compact?: boolean;
}

export function EnhancedStoryCard({
  story,
  onEdit,
  onDelete,
  onUpdate,
  showMetadata = true,
  compact = false
}: EnhancedStoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const readiness = calculateReadiness(story);
  const completion = calculateCompletion(story);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'testing': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'ready': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover-scale transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`${getPriorityColor(story.priority)} text-white`}>
                {story.priority}
              </Badge>
              <Badge variant="outline" className={`${getStatusColor(story.status)} text-white`}>
                {story.status.replace('_', ' ')}
              </Badge>
              {story.story_type && (
                <Badge variant="secondary">
                  {story.story_type}
                </Badge>
              )}
              {story.story_points && (
                <Badge variant="outline" className="gap-1">
                  <Target className="h-3 w-3" />
                  {story.story_points} pts
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{story.title}</CardTitle>
            {story.description && !compact && (
              <CardDescription className="line-clamp-2">
                {story.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!compact && (
        <CardContent className="space-y-4">
          {/* Quick metadata preview */}
          <div className="grid grid-cols-2 gap-4">
            {story.user_persona && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Persona</span>
                </div>
                <p className="text-sm font-medium truncate">{story.user_persona}</p>
              </div>
            )}
            
            {story.sprint && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Sprint</span>
                </div>
                <p className="text-sm font-medium">{story.sprint}</p>
              </div>
            )}
          </div>

          {/* Tags preview */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {story.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {story.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{story.tags.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Confidence level */}
          {story.confidence_level && (
            <div className="flex items-center gap-2">
              <ConfidenceLevelBadge level={story.confidence_level} />
            </div>
          )}

          {/* Progress indicators */}
          {(story.definition_of_ready || story.definition_of_done) && (
            <div className="grid grid-cols-2 gap-4">
              {story.definition_of_ready && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Ready</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${readiness.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{readiness.percentage}%</span>
                  </div>
                </div>
              )}
              
              {story.definition_of_done && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Done</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${completion.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{completion.percentage}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acceptance criteria preview */}
          {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Acceptance Criteria</p>
              <ul className="space-y-1">
                {story.acceptance_criteria.slice(0, 2).map((criteria, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span className="line-clamp-1">{criteria}</span>
                  </li>
                ))}
                {story.acceptance_criteria.length > 2 && (
                  <li className="text-sm text-muted-foreground italic">
                    +{story.acceptance_criteria.length - 2} more criteria
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      )}

      {showMetadata && (
        <>
          <Separator />
          <CardFooter className="flex-col items-stretch p-0">
            <Button
              variant="ghost"
              className="w-full rounded-t-none"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
            
            {expanded && (
              <div className="p-6 pt-0 animate-accordion-down">
                <StoryMetadataPanel 
                  story={story} 
                  onUpdate={onUpdate}
                  readonly={!onUpdate}
                />
              </div>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}
