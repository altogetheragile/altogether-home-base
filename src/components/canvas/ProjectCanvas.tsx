import React, { useEffect, useState, useCallback, useRef } from 'react';
import BaseCanvas, { CanvasData, CanvasElement, BaseCanvasRef } from './BaseCanvas';
import { CanvasProvider } from './CanvasProvider';
import { BMCCanvasElement } from './elements/BMCCanvasElement';
import { StoryCardElement } from './elements/StoryCardElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
import { useCanvas, useCanvasMutations } from '@/hooks/useCanvas';
import { useCanvasRealtime } from '@/hooks/canvas/useCanvasRealtime';
import { Button } from '@/components/ui/button';
import { Toolbar } from './Toolbar';
import { 
  Plus, 
  Building2, 
  FileText, 
  StickyNote,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProjectCanvasProps {
  projectId: string;
  projectName: string;
}

export const ProjectCanvas: React.FC<ProjectCanvasProps> = ({
  projectId,
  projectName,
}) => {
  const { data: canvas, isLoading } = useCanvas(projectId);
  const { createCanvas, updateCanvas } = useCanvasMutations();
  const { toast } = useToast();
  const canvasRef = useRef<BaseCanvasRef>(null);
  
  const [canvasData, setCanvasData] = useState<CanvasData>({ elements: [] });
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Initialize canvas data
  useEffect(() => {
    if (canvas) {
      setCanvasData(canvas.data);
    } else if (!isLoading) {
      // Create initial canvas if none exists
      const initialData: CanvasData = { elements: [] };
      setCanvasData(initialData);
      createCanvas.mutate({ projectId, data: initialData });
    }
  }, [canvas, isLoading, createCanvas, projectId]);

  // Real-time collaboration
  const { isConnected, activeUsers } = useCanvasRealtime({
    canvasId: projectId,
    onDataChange: (data: CanvasData) => {
      setCanvasData(data);
    },
    isEnabled: !!canvas,
  });

  const handleDataChange = useCallback((newData: CanvasData) => {
    setCanvasData(newData);
    updateCanvas.mutate({ projectId, data: newData });
  }, [updateCanvas, projectId]);

  const handleAddElement = (type: string) => {
    const newElement: CanvasElement = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      content: getDefaultContent(type),
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      size: getDefaultSize(type),
    };

    const newData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    handleDataChange(newData);
    setSelectedElements([newElement.id]);
  };

  const handleElementUpdate = (elementId: string, updates: Partial<CanvasElement>) => {
    const newData = {
      ...canvasData,
      elements: canvasData.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    };
    handleDataChange(newData);
  };

  const handleElementDelete = (elementId: string) => {
    const newData = {
      ...canvasData,
      elements: canvasData.elements.filter(el => el.id !== elementId),
    };
    handleDataChange(newData);
    setSelectedElements(prev => prev.filter(id => id !== elementId));
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.1, Math.min(3, newZoom));
    });
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    try {
      const dataUrl = await canvasRef.current.exportCanvas({ format: 'png', quality: 2 });
      const link = document.createElement('a');
      link.download = `${projectName}-canvas.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Canvas exported",
        description: "Your canvas has been exported as an image.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export canvas",
        variant: "destructive",
      });
    }
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElements.includes(element.id);
    
    const commonProps = {
      id: element.id,
      position: element.position,
      size: element.size,
      data: element.content,
      isSelected,
      onSelect: () => setSelectedElements([element.id]),
      onMove: (position: { x: number; y: number }) => {
        handleElementUpdate(element.id, { position });
      },
      onResize: (size: { width: number; height: number }) => {
        handleElementUpdate(element.id, { size });
      },
    };

    switch (element.type) {
      case 'bmc':
        return <BMCCanvasElement key={element.id} {...commonProps} />;
      case 'story':
        return <StoryCardElement key={element.id} {...commonProps} />;
      case 'sticky':
        return <StickyNoteElement key={element.id} {...commonProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <CanvasProvider>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{projectName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              {isConnected ? 'Connected' : 'Offline'}
              {activeUsers.length > 0 && (
                <span>• {activeUsers.length} collaborator{activeUsers.length > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Toolbar 
              onAddElement={handleAddElement}
              onZoomIn={() => handleZoom('in')}
              onZoomOut={() => handleZoom('out')}
              onExport={handleExport}
              zoom={zoom}
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'top left',
            }}
            className="w-full h-full"
          >
            <BaseCanvas
              ref={canvasRef}
              data={canvasData}
              onDataChange={handleDataChange}
              className="w-full h-full"
            >
              {canvasData.elements.map(renderElement)}
            </BaseCanvas>
          </div>
        </div>
      </div>
    </CanvasProvider>
  );
};

function getDefaultContent(type: string) {
  switch (type) {
    case 'bmc':
      return {
        keyPartners: 'Key partners...',
        keyActivities: 'Key activities...',
        valuePropositions: 'Value propositions...',
        customerRelationships: 'Customer relationships...',
        customerSegments: 'Customer segments...',
        keyResources: 'Key resources...',
        channels: 'Channels...',
        costStructure: 'Cost structure...',
        revenueStreams: 'Revenue streams...',
      };
    case 'story':
      return {
        title: 'New User Story',
        story: 'As a [user], I want [goal] so that [benefit]',
        priority: 'medium',
        storyPoints: 3,
        status: 'backlog',
      };
    case 'sticky':
      return {
        text: 'New note...',
        color: 'yellow',
      };
    default:
      return {};
  }
}

function getDefaultSize(type: string) {
  switch (type) {
    case 'bmc':
      return { width: 400, height: 300 };
    case 'story':
      return { width: 240, height: 160 };
    case 'sticky':
      return { width: 150, height: 120 };
    default:
      return { width: 200, height: 150 };
  }
}