import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Copy } from 'lucide-react';
import { TypeChangeDropdown } from './TypeChangeDropdown';

interface SimpleFloatingToolbarProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  currentType?: 'epic' | 'feature' | 'story';
  onChangeType?: (newType: 'epic' | 'feature' | 'story') => void;
}

export const SimpleFloatingToolbar: React.FC<SimpleFloatingToolbarProps> = ({
  onEdit,
  onDelete,
  onDuplicate,
  currentType,
  onChangeType,
}) => {
  const handleClick = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    action?.();
  };

  return (
    <div 
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 bg-popover border border-border rounded-lg shadow-lg p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => handleClick(e, onEdit)}
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>
        {currentType && onChangeType && (
          <TypeChangeDropdown currentType={currentType} onChangeType={onChangeType} />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => handleClick(e, onDuplicate)}
          title="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => handleClick(e, onDelete)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
