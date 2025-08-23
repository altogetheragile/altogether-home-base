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