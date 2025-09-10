import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RichTextFieldEditor } from './RichTextFieldEditor';
import type { TemplateSection, TemplateField } from '@/types/template';
import { 
  Move, 
  Trash2, 
  GripHorizontal, 
  Eye, 
  EyeOff,
  Copy,
  Settings
} from 'lucide-react';

interface TemplateSectionEditorProps {
  section: TemplateSection;
  isSelected: boolean;
  selectedField: TemplateField | null;
  canvasDimensions: { width: number; height: number };
  zoom: number;
  pan: { x: number; y: number };
  showTitle: boolean;
  snapToGrid: boolean;
  gridSize: number;
  onSelect: (section: TemplateSection, isCtrlPressed?: boolean) => void;
  onSelectField: (field: TemplateField) => void;
  onUpdate: (updates: Partial<TemplateSection>) => void;
  onUpdateField: (fieldId: string, updates: Partial<TemplateField>) => void;
  onDelete: () => void;
  onDeleteField: (fieldId: string) => void;
}

export const TemplateSectionEditor: React.FC<TemplateSectionEditorProps> = ({
  section,
  isSelected,
  selectedField,
  canvasDimensions,
  zoom,
  pan,
  showTitle,
  snapToGrid,
  gridSize,
  onSelect,
  onSelectField,
  onUpdate,
  onUpdateField,
  onDelete,
  onDeleteField
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent selection of resize handles or other interactive elements
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Select the section (with multi-select support)
    onSelect(section, e.ctrlKey || e.metaKey);
    
    // Set up for dragging - calculate offset from mouse position to section's top-left
    const rect = sectionRef.current?.getBoundingClientRect();
    const parent = sectionRef.current?.parentElement;
    if (rect && parent) {
      const parentRect = parent.getBoundingClientRect();
      
      // Calculate the mouse position relative to the canvas
      const mouseCanvasX = (e.clientX - parentRect.left - 32 - pan.x) / (zoom / 100);
      const mouseCanvasY = (e.clientY - parentRect.top - 32 - pan.y) / (zoom / 100);
      
      // Store offset from mouse to section origin to prevent jumping
      setDragOffset({
        x: mouseCanvasX - section.x,
        y: mouseCanvasY - section.y
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sectionRef.current) return;
    
    const parent = sectionRef.current.parentElement;
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = (e.clientX - parentRect.left - 32 - pan.x) / (zoom / 100) - dragOffset.x;
    const canvasY = (e.clientY - parentRect.top - 32 - pan.y) / (zoom / 100) - dragOffset.y;
    
    // Constrain to canvas boundaries
    let newX = Math.max(0, Math.min(canvasX, canvasDimensions.width - section.width));
    let newY = Math.max(0, Math.min(canvasY, canvasDimensions.height - section.height));
    
    // Apply grid snapping if enabled
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    onUpdate({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset]);

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = section.x;
    const startY = section.y;
    const startWidth = section.width;
    const startHeight = section.height;
    
    const handleResizeMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      
      const parent = sectionRef.current.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const deltaX = (e.clientX - startMouseX) / (zoom / 100);
      const deltaY = (e.clientY - startMouseY) / (zoom / 100);
      
      let newX = startX;
      let newY = startY;
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      // Calculate new dimensions based on resize direction
      switch (direction) {
        case 'se': // Bottom-right
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(80, startHeight + deltaY);
          break;
        case 'sw': // Bottom-left
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(80, startHeight + deltaY);
          newX = Math.max(0, startX + deltaX);
          break;
        case 'ne': // Top-right
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(80, startHeight - deltaY);
          newY = Math.max(0, startY + deltaY);
          break;
        case 'nw': // Top-left
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(80, startHeight - deltaY);
          newX = Math.max(0, startX + deltaX);
          newY = Math.max(0, startY + deltaY);
          break;
        case 'n': // Top edge
          newHeight = Math.max(80, startHeight - deltaY);
          newY = Math.max(0, startY + deltaY);
          break;
        case 's': // Bottom edge
          newHeight = Math.max(80, startHeight + deltaY);
          break;
        case 'w': // Left edge
          newWidth = Math.max(100, startWidth - deltaX);
          newX = Math.max(0, startX + deltaX);
          break;
        case 'e': // Right edge
          newWidth = Math.max(100, startWidth + deltaX);
          break;
      }
      
      // Constrain to canvas boundaries
      newX = Math.max(0, Math.min(newX, canvasDimensions.width - newWidth));
      newY = Math.max(0, Math.min(newY, canvasDimensions.height - newHeight));
      newWidth = Math.min(newWidth, canvasDimensions.width - newX);
      newHeight = Math.min(newHeight, canvasDimensions.height - newY);
      
      onUpdate({ x: newX, y: newY, width: newWidth, height: newHeight });
    };
    
    const handleResizeUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
    };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeUp);
  };

  const renderField = (field: TemplateField) => {
    const isFieldSelected = selectedField?.id === field.id;
    
    return (
      <div
        key={field.id}
        className={`absolute border rounded cursor-pointer transition-all ${
          isFieldSelected 
            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
            : 'border-muted-foreground/30 hover:border-primary/50 bg-background/80'
        }`}
        style={{
          left: field.x || 0,
          top: field.y || 0,
          width: field.width || 200,
          height: field.height || 40
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectField(field);
        }}
      >
        <div className="p-2 h-full">
          {/* Show field label and type only when selected or in property panel */}
          {isFieldSelected && (
            <div className="flex items-start justify-between mb-2">
              <div className="text-xs font-medium truncate pr-2">
                {field.label}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteField(field.id);
                  }}
                >
                  <Trash2 className="h-2 w-2" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Direct editable content */}
          <div 
            className="flex-1 w-full h-full min-h-[1.5rem] p-1 text-xs leading-relaxed cursor-text focus:outline-none focus:ring-1 focus:ring-primary rounded border-0"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const content = e.currentTarget.textContent || '';
              onUpdateField(field.id, { content });
            }}
            onFocus={() => onSelectField(field)}
            style={{ 
              minHeight: field.type === 'textarea' ? '3rem' : '1.5rem',
              whiteSpace: field.type === 'textarea' ? 'pre-wrap' : 'nowrap',
              overflow: field.type === 'textarea' ? 'auto' : 'hidden'
            }}
          >
            {field.content || field.placeholder || `Enter ${field.type} content...`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={sectionRef}
      className={`absolute border-2 rounded-lg transition-all cursor-move z-20 ${
        isSelected 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
          : 'border-muted-foreground/30 hover:border-primary/50 bg-card/80'
      } ${isDragging ? 'shadow-lg' : ''}`}
      style={{
        left: section.x,
        top: section.y,
        width: section.width,
        height: section.height,
        backgroundColor: section.backgroundColor,
        borderColor: isSelected ? undefined : section.borderColor
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Section Header - only show if showTitle is true */}
      {showTitle && (
        <div className="absolute top-0 left-0 right-0 bg-background/90 border-b px-2 py-1 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium truncate">
                {section.title}
              </span>
            </div>
            
            {isSelected && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimal Header - always show for interaction */}
      {!showTitle && isSelected && (
        <div className="absolute top-1 left-1 flex items-center gap-1 bg-background/80 rounded px-1 py-0.5">
          <GripHorizontal className="h-2 w-2 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-2 w-2" />
          </Button>
        </div>
      )}

      {/* Section Content */}
      <div className={`absolute inset-0 p-2 overflow-hidden ${showTitle ? 'top-8' : 'top-0'}`}>
        {section.fields.map(renderField)}
        
        {section.fields.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-xs mb-1">No fields yet</p>
              <p className="text-xs">Add fields from the toolbar</p>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div
            className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-primary cursor-nw-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-primary cursor-ne-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-primary cursor-sw-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-primary cursor-se-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
          
          {/* Edge handles */}
          <div
            className="resize-handle absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary cursor-n-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          />
          <div
            className="resize-handle absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-primary cursor-s-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          <div
            className="resize-handle absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary cursor-w-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          <div
            className="resize-handle absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary cursor-e-resize rounded-full border-2 border-background z-30"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
        </>
      )}
    </div>
  );
};