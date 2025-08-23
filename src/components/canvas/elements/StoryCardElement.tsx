import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2, Users } from 'lucide-react';
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
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'todo': 
      case 'backlog': return 'bg-gray-100 text-gray-800';
      case 'in progress': 
      case 'development': return 'bg-blue-100 text-blue-800';
      case 'done': 
      case 'completed': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-secondary text-secondary-foreground';
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
      <Card className="h-full border-2 hover:border-primary/50 transition-colors">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">User Story</span>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Story Content */}
          <div className="flex-1 space-y-3">
            {data ? (
              <>
                {/* Title */}
                <h4 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem]">
                  {data.title}
                </h4>

                {/* Story Text */}
                <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                  {data.story}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {data.priority && (
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs px-2 py-0.5", getPriorityColor(data.priority))}
                    >
                      {data.priority}
                    </Badge>
                  )}
                  {data.storyPoints && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {data.storyPoints} pts
                    </Badge>
                  )}
                  {data.status && (
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs px-2 py-0.5", getStatusColor(data.status))}
                    >
                      {data.status}
                    </Badge>
                  )}
                </div>

                {/* Epic */}
                {data.epic && (
                  <div className="text-xs text-muted-foreground">
                    Epic: {data.epic}
                  </div>
                )}

                {/* Acceptance Criteria Count */}
                {data.acceptanceCriteria && data.acceptanceCriteria.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {data.acceptanceCriteria.length} criteria
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No story data</p>
                  <p className="text-xs">Click edit to create</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="w-full h-8 text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              {data ? 'Edit Story' : 'Create Story'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AIToolElement>
  );
};