import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Copy, ListPlus } from 'lucide-react';

interface StoryFloatingToolbarProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddToBacklog?: () => void;
}

export const StoryFloatingToolbar: React.FC<StoryFloatingToolbarProps> = ({
  onEdit,
  onDelete,
  onDuplicate,
  onAddToBacklog,
}) => {
  return (
    <div 
      className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card border rounded-lg shadow-lg p-1 z-[1001]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onEdit}
          title="Edit Story"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {onDuplicate && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onDuplicate}
          title="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
      {onAddToBacklog && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onAddToBacklog}
          title="Add to Backlog"
        >
          <ListPlus className="h-3.5 w-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};
