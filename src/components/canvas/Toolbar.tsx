import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Building2, 
  FileText, 
  StickyNote,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ToolbarProps {
  onAddElement: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExport: () => void;
  zoom: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddElement,
  onZoomIn,
  onZoomOut,
  onExport,
  zoom,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border rounded-lg shadow-sm">
      {/* Add Elements */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Element
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAddElement('bmc')}>
            <Building2 className="h-4 w-4 mr-2" />
            Business Model Canvas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('story')}>
            <FileText className="h-4 w-4 mr-2" />
            User Story
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('sticky')}>
            <StickyNote className="h-4 w-4 mr-2" />
            Sticky Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Export */}
      <Button variant="ghost" size="sm" onClick={onExport}>
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};