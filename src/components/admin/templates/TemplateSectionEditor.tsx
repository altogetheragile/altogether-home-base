import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  onSelect: (section: TemplateSection) => void;
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
    if (e.target !== e.currentTarget && !e.currentTarget.contains(e.target as Node)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    onSelect(section);
    
    const rect = sectionRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sectionRef.current) return;
    
    const parent = sectionRef.current.parentElement;
    if (!parent) return;
    
    const parentRect = parent.getBoundingClientRect();
    const newX = Math.max(0, Math.min(
      e.clientX - parentRect.left - dragOffset.x,
      parentRect.width - section.width
    ));
    const newY = Math.max(0, Math.min(
      e.clientY - parentRect.top - dragOffset.y,
      parentRect.height - section.height
    ));
    
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
    
    const handleResizeMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const parent = sectionRef.current.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      
      if (direction === 'se') {
        const newWidth = Math.max(150, e.clientX - rect.left);
        const newHeight = Math.max(100, e.clientY - rect.top);
        onUpdate({ 
          width: Math.min(newWidth, parentRect.width - section.x),
          height: Math.min(newHeight, parentRect.height - section.y)
        });
      }
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
        <div className="p-2 h-full flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">
              {field.label}
            </div>
            <Badge variant="outline" className="text-xs mt-1">
              {field.type}
            </Badge>
          </div>
          
          {isFieldSelected && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteField(field.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={sectionRef}
      className={`absolute border-2 rounded-lg transition-all cursor-move ${
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
      {/* Section Header */}
      <div className="absolute top-0 left-0 right-0 bg-background/90 border-b px-2 py-1 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripHorizontal className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium truncate">
              {section.title}
            </span>
            <Badge variant="secondary" className="text-xs">
              {section.fields.length}
            </Badge>
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

      {/* Section Content */}
      <div className="absolute inset-0 top-8 p-2 overflow-hidden">
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

      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize"
          style={{
            borderTopLeftRadius: '4px'
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
        />
      )}

      {/* Selection Indicators */}
      {isSelected && (
        <>
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-primary rounded-full" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary rounded-full" />
        </>
      )}
    </div>
  );
};