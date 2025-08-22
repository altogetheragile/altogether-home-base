import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Move3D } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryCardElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: {
    title: string;
    story: string;
    priority?: string;
    storyPoints?: number;
    epic?: string;
    status?: string;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: {
    title: string;
    story: string;
    priority?: string;
    storyPoints?: number;
    epic?: string;
    status?: string;
  }) => void;
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
}) => {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [isEditingStory, setIsEditingStory] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(data.title);
  const [editStory, setEditStory] = React.useState(data.story);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const storyTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();

    if ((isEditingTitle || isEditingStory) || !onMove) return;

    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      onMove({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContentChange) {
      setIsEditingTitle(true);
      setEditTitle(data.title);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  const handleStoryDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContentChange) {
      setIsEditingStory(true);
      setEditStory(data.story);
      setTimeout(() => storyTextareaRef.current?.focus(), 0);
    }
  };

  const handleTitleSave = () => {
    onContentChange?.({ ...data, title: editTitle });
    setIsEditingTitle(false);
  };

  const handleStorySave = () => {
    onContentChange?.({ ...data, story: editStory });
    setIsEditingStory(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(data.title);
    setIsEditingTitle(false);
  };

  const handleStoryCancel = () => {
    setEditStory(data.story);
    setIsEditingStory(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
  };

  const handleStoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStorySave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleStoryCancel();
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div
      className={cn(
        "absolute select-none border-2 rounded-lg",
        isSelected ? "border-primary" : "border-transparent",
        "hover:border-primary/50 transition-colors",
        (isEditingTitle || isEditingStory) ? "cursor-text" : "cursor-move"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: 240,
        minHeight: 120,
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="w-full h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Story</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {data.priority && (
                <Badge variant="outline" className={cn("text-xs", getPriorityColor(data.priority))}>
                  {data.priority}
                </Badge>
              )}
              {data.storyPoints && (
                <Badge variant="secondary" className="text-xs">
                  {data.storyPoints} pts
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-sm line-clamp-2">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleTitleSave}
                className="w-full text-sm border-none outline-none bg-transparent text-foreground"
                placeholder="Enter story title..."
              />
            ) : (
              <span 
                className="cursor-text"
                onDoubleClick={handleTitleDoubleClick}
              >
                {data.title || 'Double-click to edit title...'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            {isEditingStory ? (
              <textarea
                ref={storyTextareaRef}
                value={editStory}
                onChange={(e) => setEditStory(e.target.value)}
                onKeyDown={handleStoryKeyDown}
                onBlur={handleStorySave}
                className="w-full text-xs resize-none border-none outline-none bg-transparent text-muted-foreground"
                placeholder="Enter story description..."
                rows={3}
              />
            ) : (
              <p 
                className="text-xs text-muted-foreground line-clamp-3 cursor-text"
                onDoubleClick={handleStoryDoubleClick}
              >
                {data.story || 'Double-click to edit story...'}
              </p>
            )}
            {data.epic && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  Epic: {data.epic}
                </Badge>
              </div>
            )}
            {data.status && (
              <div className="flex justify-end">
                <Badge variant="secondary" className="text-xs">
                  {data.status}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isSelected && (
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-se-resize flex items-center justify-center">
          <Move3D className="w-2 h-2 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};