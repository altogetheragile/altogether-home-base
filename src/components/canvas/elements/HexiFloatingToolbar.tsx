import React from 'react';
import { Button } from '@/components/ui/button';
import { Move, Pencil, Copy, Trash2, BookmarkPlus } from 'lucide-react';

export interface HexiFloatingToolbarProps {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSaveToKB?: () => void;
  showEdit?: boolean;
  showDuplicate?: boolean;
  showSaveToKB?: boolean;
}

export const HexiFloatingToolbar: React.FC<HexiFloatingToolbarProps> = ({
  onEdit,
  onDuplicate,
  onDelete,
  onSaveToKB,
  showEdit = true,
  showDuplicate = true,
  showSaveToKB = false,
}) => {
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-card border rounded-md p-1 shadow-lg z-[9999]">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 cursor-grab"
        title="Move (drag element)"
      >
        <Move className="h-3 w-3" />
      </Button>
      
      {showEdit && onEdit && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
      
      {showDuplicate && onDuplicate && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}

      {showSaveToKB && onSaveToKB && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            onSaveToKB();
          }}
          title="Save to Knowledge Base"
        >
          <BookmarkPlus className="h-3 w-3" />
        </Button>
      )}
      
      {onDelete && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
