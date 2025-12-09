import React from 'react';
import { Button } from '@/components/ui/button';
import { Move, Eye, Pencil, Copy, Trash2, BookmarkPlus, Link2 } from 'lucide-react';

export interface HexiFloatingToolbarProps {
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSaveToKB?: () => void;
  onLinkResource?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDuplicate?: boolean;
  showSaveToKB?: boolean;
  showLinkResource?: boolean;
  hasLinkedResource?: boolean;
}

export const HexiFloatingToolbar: React.FC<HexiFloatingToolbarProps> = ({
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onSaveToKB,
  onLinkResource,
  showView = true,
  showEdit = true,
  showDuplicate = true,
  showSaveToKB = false,
  showLinkResource = false,
  hasLinkedResource = false,
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

      {showView && onView && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          title="View"
        >
          <Eye className="h-3 w-3" />
        </Button>
      )}
      
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

      {showLinkResource && onLinkResource && (
        <Button
          size="sm"
          variant="ghost"
          className={`h-7 w-7 p-0 ${hasLinkedResource ? 'text-primary' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLinkResource();
          }}
          title={hasLinkedResource ? "Edit Linked Resource" : "Link Resource"}
        >
          <Link2 className="h-3 w-3" />
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
