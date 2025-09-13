import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextFieldEditor } from './RichTextFieldEditor';
import { SafeText } from '@/lib/safe';
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
    
    // Don't drag when clicking on field content or controls
    const target = e.target as HTMLElement;
    if (target.closest('[data-field-content]') || target.closest('[data-field-controls]')) return;
    
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
    const [isEditing, setIsEditing] = useState(false);
    const [isDraggingField, setIsDraggingField] = useState(false);
    const [fieldDragOffset, setFieldDragOffset] = useState({ x: 0, y: 0 });
    
    const handleFieldMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectField(field);
    };

    const handleFieldDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
    };

    const handleDragHandleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDraggingField(true);
      
      const parent = sectionRef.current?.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const mouseCanvasX = (e.clientX - parentRect.left - 32 - pan.x) / (zoom / 100);
        const mouseCanvasY = (e.clientY - parentRect.top - 32 - pan.y) / (zoom / 100);
        
        setFieldDragOffset({
          x: mouseCanvasX - section.x - (field.x || 0),
          y: mouseCanvasY - section.y - (field.y || 0)
        });
      }
    };

    const handleFieldDragMove = (e: MouseEvent) => {
      if (!isDraggingField || !sectionRef.current) return;
      
      const parent = sectionRef.current.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const canvasX = (e.clientX - parentRect.left - 32 - pan.x) / (zoom / 100) - section.x - fieldDragOffset.x;
      const canvasY = (e.clientY - parentRect.top - 32 - pan.y) / (zoom / 100) - section.y - fieldDragOffset.y;
      
      // Constrain field movement within section boundaries
      const newX = Math.max(0, Math.min(canvasX, section.width - (field.width || 200)));
      const newY = Math.max(0, Math.min(canvasY, section.height - (field.height || 40)));
      
      onUpdateField(field.id, { x: newX, y: newY });
    };

    const handleFieldDragEnd = () => {
      setIsDraggingField(false);
    };

    React.useEffect(() => {
      if (isDraggingField) {
        document.addEventListener('mousemove', handleFieldDragMove);
        document.addEventListener('mouseup', handleFieldDragEnd);
        
        return () => {
          document.removeEventListener('mousemove', handleFieldDragMove);
          document.removeEventListener('mouseup', handleFieldDragEnd);
        };
      }
    }, [isDraggingField, fieldDragOffset]);

    const handleTextChange = (value: string) => {
      // Ensure content is always a string to prevent object-in-JSX errors
      onUpdateField(field.id, { content: String(value ?? '') });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && field.type !== 'textarea') {
        e.preventDefault();
        setIsEditing(false);
      } else if (e.key === 'Enter' && e.ctrlKey && field.type === 'textarea') {
        e.preventDefault();
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
      }
      // Stop propagation to prevent canvas shortcuts
      e.stopPropagation();
    };
    
    return (
      <div
        key={field.id}
        className={`absolute border rounded transition-all ${
          isFieldSelected 
            ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
            : 'border-muted-foreground/30 hover:border-primary/50 bg-background/80'
        } ${isDraggingField ? 'shadow-lg z-50' : ''}`}
        style={{
          left: field.x || 0,
          top: field.y || 0,
          width: field.width || 200,
          height: field.height || 40
        }}
        onMouseDown={handleFieldMouseDown}
        onDoubleClick={handleFieldDoubleClick}
        data-field-content="true"
      >
        {/* Drag handle - only visible when selected */}
        {isFieldSelected && (
          <>
            <div className="absolute -top-6 left-0 flex items-center gap-1 bg-background/95 border rounded px-1 py-0.5 shadow-sm z-30" data-field-controls="true">
              <div
                className="cursor-move p-1 hover:bg-accent rounded"
                onMouseDown={handleDragHandleMouseDown}
                title="Drag to reposition"
              >
                <GripHorizontal className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">
                {field.label}
              </span>
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
          </>
        )}
        
        <div className="p-2 h-full" data-field-content="true">
          {isEditing ? (
            field.type === 'textarea' ? (
              <Textarea
                value={field.content || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={handleKeyDown}
                placeholder={field.placeholder || `Enter ${field.type} content...`}
                className="w-full h-full resize-none border-0 bg-transparent p-0 text-xs focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
            ) : (
              <Input
                value={field.content || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={handleKeyDown}
                placeholder={field.placeholder || `Enter ${field.type} content...`}
                className="w-full h-full border-0 bg-transparent p-0 text-xs focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
            )
          ) : (
            <div 
              className="w-full h-full p-1 text-xs leading-relaxed cursor-text rounded hover:bg-accent/20 min-h-[1.5rem] flex items-center"
              title="Double-click to edit"
            >
              {(() => {
                // Safely handle field content to prevent object-in-JSX errors
                const displayText = typeof field.content === 'string' ? field.content : '';
                return displayText ? (
                  <SafeText value={displayText} />
                ) : (
                  <span className="text-muted-foreground italic">
                    {field.placeholder || `Enter ${field.type} content...`}
                  </span>
                );
              })()}
            </div>
          )}
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
      {/* Clean section - no visible metadata unless selected */}
      {isSelected && (
        <div className="absolute -top-8 left-0 flex items-center gap-1 bg-background/95 border rounded px-2 py-1 shadow-sm z-40">
          <GripHorizontal className="h-3 w-3 text-muted-foreground" />
          {showTitle && (
            <span className="text-xs font-medium text-muted-foreground">
              {section.title}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 ml-1"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Section Content */}
      <div className="absolute inset-0 p-2 overflow-hidden">
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