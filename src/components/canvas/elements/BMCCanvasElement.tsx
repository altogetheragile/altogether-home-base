import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AIToolElement from './AIToolElement';
import BMCCanvas, { BMCCanvasRef, BMCData } from '../templates/BMCCanvas';

interface BMCCanvasElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: BMCData;
  isSelected?: boolean;
  onSelect?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (position: { x: number; y: number }) => void;
  onContentChange?: (data: BMCData) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export const BMCCanvasElement: React.FC<BMCCanvasElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  onSelect,
  onResize,
  onMove,
  onContentChange,
  onDelete,
  onEdit,
}) => {
  const bmcRef = useRef<BMCCanvasRef>(null);

  const handleUpdate = (element: any) => {
    onMove?.(element.position);
  };

  const element = {
    id,
    type: 'bmc' as const,
    position,
    size,
    content: data || {}
  };

  return (
    <AIToolElement
      element={element}
      isSelected={isSelected || false}
      onSelect={onSelect || (() => {})}
      onUpdate={handleUpdate}
      onDelete={onDelete || (() => {})}
    >
      <div className="w-full h-full flex flex-col">
        {/* Header with controls */}
        <div className="flex items-center justify-between p-3 border-b bg-background">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Business Model Canvas</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              AI Generated
            </Badge>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* BMC Canvas Content */}
        <div className="flex-1 min-h-0">
          <BMCCanvas
            ref={bmcRef}
            data={data}
            isEditable={true}
            onDataChange={onContentChange}
            className="h-full border-0 rounded-none"
          />
        </div>
      </div>
    </AIToolElement>
  );
};