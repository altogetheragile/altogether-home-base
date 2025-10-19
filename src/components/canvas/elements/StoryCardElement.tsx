import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import AIToolElement from './AIToolElement';

interface StoryData {
  title: string;
  story: string;
  acceptanceCriteria?: string[];
  priority: string;
  storyPoints: number;
  epic?: string;
  status: string;
}

interface StoryCardElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: StoryData;
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: StoryData) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  storyLevel?: 'epic' | 'feature' | 'story' | 'task';
}

export const StoryCardElement: React.FC<StoryCardElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onResize,
  onMove,
  onContentChange,
  onDelete,
  onEdit,
  storyLevel = 'story',
}) => {
  const handleUpdate = (element: any) => {
    onMove?.(element.position);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed': return 'default';
      case 'in_progress':
      case 'active': return 'default';
      case 'testing': return 'secondary';
      case 'ready': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'epic': return 'border-purple-500 bg-purple-50 dark:bg-purple-950/20';
      case 'feature': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'story': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'task': return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      default: return 'border-border bg-card';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'epic': return '🎯';
      case 'feature': return '⭐';
      case 'story': return '📝';
      case 'task': return '✓';
      default: return '📄';
    }
  };

  const element = {
    id,
    type: 'story' as const,
    position,
    size,
    content: data || {}
  };

  return (
    <AIToolElement
      element={element}
      isSelected={isSelected || false}
      onSelect={onSelect || (() => {})}
      onUpdate={handleUpdate}
      onDelete={onDelete || (() => {})}
    >
      <div 
        className={cn(
          "h-full border-2 rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer shadow-sm",
          getLevelColor(storyLevel)
        )}
        onClick={onEdit}
      >
        {data ? (
          <div className="space-y-2">
            {/* Level Badge */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium opacity-70">
                {getLevelIcon(storyLevel)} {storyLevel.toUpperCase()}
              </span>
              {data.status && (
                <Badge 
                  variant={getStatusColor(data.status)}
                  className="text-xs px-1.5 py-0"
                >
                  {data.status}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-semibold line-clamp-2 leading-tight">
              {data.title}
            </h4>

            {/* Metadata */}
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {data.priority && (
                  <Badge 
                    variant={getPriorityColor(data.priority)}
                    className="text-xs px-1.5 py-0"
                  >
                    {data.priority}
                  </Badge>
                )}
                {data.storyPoints !== undefined && data.storyPoints > 0 && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {data.storyPoints} pts
                  </span>
                )}
              </div>
            </div>

            {/* Acceptance Criteria Count */}
            {data.acceptanceCriteria && data.acceptanceCriteria.length > 0 && (
              <div className="text-xs text-muted-foreground">
                ✓ {data.acceptanceCriteria.length} criteria
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6 mb-1 opacity-50" />
            <p className="text-xs">Click to edit</p>
          </div>
        )}
      </div>
    </AIToolElement>
  );
};