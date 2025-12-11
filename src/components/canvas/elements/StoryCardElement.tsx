import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ListPlus, Pencil } from 'lucide-react';
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
  onAddToBacklog?: () => void;
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
  onAddToBacklog,
}) => {
  const handleUpdate = (element: any) => {
    onMove?.(element.position);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
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
        className="h-full bg-card border-2 border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer"
        onClick={onEdit}
      >
        {data ? (
          <div className="space-y-2">
            {/* Title */}
            <h4 className="text-sm font-semibold line-clamp-2 leading-tight">
              {data.title}
            </h4>

            {/* Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {data.priority && (
                  <Badge 
                    variant={getPriorityColor(data.priority)}
                    className="text-xs px-2 py-0.5"
                  >
                    {data.priority}
                  </Badge>
                )}
                {data.storyPoints && (
                  <span className="text-xs text-muted-foreground">
                    {data.storyPoints} pts
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons - show when selected */}
            {isSelected && (
              <div className="flex gap-2 mt-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                {onAddToBacklog && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToBacklog();
                    }}
                  >
                    <ListPlus className="h-3 w-3 mr-1" />
                    Add to Backlog
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6 mb-1 opacity-50" />
            <p className="text-xs">Click to create story</p>
          </div>
        )}
      </div>
    </AIToolElement>
  );
};