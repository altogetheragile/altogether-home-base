import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { RefreshCw, Layers, Puzzle, FileText } from 'lucide-react';

type ElementType = 'epic' | 'feature' | 'story';

interface TypeChangeDropdownProps {
  currentType: ElementType;
  onChangeType: (newType: ElementType) => void;
}

export const TypeChangeDropdown: React.FC<TypeChangeDropdownProps> = ({
  currentType,
  onChangeType,
}) => {
  const types: { type: ElementType; label: string; icon: React.ReactNode }[] = [
    { type: 'epic', label: 'Epic', icon: <Layers className="h-3.5 w-3.5" /> },
    { type: 'feature', label: 'Feature', icon: <Puzzle className="h-3.5 w-3.5" /> },
    { type: 'story', label: 'Story', icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleClick}
          onPointerDown={(e) => e.stopPropagation()}
          title="Change Type"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onPointerDown={(e) => e.stopPropagation()}>
        {types
          .filter(t => t.type !== currentType)
          .map(({ type, label, icon }) => (
            <DropdownMenuItem
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                onChangeType(type);
              }}
              className="flex items-center gap-2"
            >
              {icon}
              <span>Convert to {label}</span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
