import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseCanvas, { CanvasData, CanvasElement, BaseCanvasRef } from './BaseCanvas';
import { CanvasProvider } from './CanvasProvider';
import BMCCanvasElement from './elements/BMCCanvasElement';
import { StoryCardElement } from './elements/StoryCardElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
import { KnowledgeItemHexiElement } from './elements/KnowledgeItemHexiElement';
import { CustomHexiElement } from './elements/CustomHexiElement';
import { PlanningFocusHexiElement } from './elements/PlanningFocusHexiElement';
import { useCanvas, useCanvasMutations } from '@/hooks/useCanvas';
import { useCanvasRealtime } from '@/hooks/canvas/useCanvasRealtime';
import { useDebounceCanvas } from '@/hooks/useDebounceCanvas';
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
  Download,
  ArrowLeft
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
  const navigate = useNavigate();
  const { data: canvas, isLoading, error } = useCanvas(projectId);
  const { createCanvas, updateCanvas } = useCanvasMutations();
  const { toast } = useToast();
  const canvasRef = useRef<BaseCanvasRef>(null);
  
  const [canvasData, setCanvasData] = useState<CanvasData>({ elements: [] });
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Get existing knowledge item IDs for selector
  const existingKnowledgeItemIds = React.useMemo(() => {
    return canvasData.elements
      .filter(el => el.type === 'knowledgeItem')
      .map(el => el.content?.knowledgeItemId)
      .filter(Boolean);
  }, [canvasData.elements]);

  // Initialize canvas data
  useEffect(() => {
    console.log('Canvas initialization:', { canvas: canvas?.id, isLoading, error: error?.message });
    
    if (canvas?.data) {
      console.log('Setting canvas data from existing canvas');
      
      // Normalize hexagon sizes
      const normalized = {
        ...canvas.data,
        elements: canvas.data.elements.map(el => {
          if (el.type === 'knowledgeItem' || el.type === 'customHexi' || el.type === 'sticky' || el.type === 'planningFocus') {
            return {
              ...el,
              size: { width: 140, height: 121 }
            };
          }
          return el;
        })
      };
      
      // Check if any changes were made
      const hasChanges = normalized.elements.some((el, idx) => 
        (el.type === 'knowledgeItem' || el.type === 'customHexi' || el.type === 'sticky' || el.type === 'planningFocus') &&
        (canvas.data.elements[idx]?.size?.width !== 140 || canvas.data.elements[idx]?.size?.height !== 121)
      );
      
      if (hasChanges) {
        console.log('Normalizing hexagon sizes');
        setCanvasData(normalized);
        // Save normalized data immediately
        if (canvas.id) {
          updateCanvas.mutate({ projectId, data: normalized });
        }
      } else {
        setCanvasData(canvas.data);
      }
    } else if (!canvas && !isLoading && !createCanvas.isPending && projectId) {
      console.log('Creating new canvas for project:', projectId);
      // Create new canvas if none exists
      const initialData = { elements: [], metadata: {} };
      setCanvasData(initialData); // Set immediately for UI responsiveness
      
      createCanvas.mutate({
        projectId,
        data: initialData
      }, {
        onSuccess: (newCanvas) => {
          console.log('Canvas created successfully:', newCanvas.id);
        },
        onError: (error) => {
          console.error('Failed to create canvas:', error);
        }
      });
    }
  }, [canvas, isLoading, projectId]); // Removed createCanvas from dependency array

  // Real-time collaboration
  const { isConnected, activeUsers } = useCanvasRealtime({
    canvasId: canvas?.id || '',
    onDataChange: (data: CanvasData) => {
      setCanvasData(data);
    },
    isEnabled: !!canvas?.id,
  });

  const handleDataChange = useCallback((newData: CanvasData) => {
    console.log('Canvas data change:', { elements: newData.elements.length, canvasId: canvas?.id });
    setCanvasData(newData);
    
    // Only update if canvas exists to prevent race conditions
    if (canvas?.id) {
      console.log('Saving canvas data to database');
      updateCanvas.mutate(
        { projectId, data: newData },
        {
          onSuccess: () => {
            console.log('Canvas data saved successfully');
          },
          onError: (error) => {
            console.error('Failed to save canvas data:', error);
          }
        }
      );
    } else {
      console.log('Canvas not available, skipping database save');
    }
  }, [updateCanvas, projectId, canvas?.id]);

  // Debounced version for frequent updates like dragging
  const { debouncedCallback: debouncedDataChange, flushCallback: flushDataChange } = useDebounceCanvas(
    handleDataChange, 
    200
  );

  const handleAddElement = (type: string) => {
    console.log('Adding element of type:', type);
    
    // Don't add elements if canvas creation is in progress
    if (createCanvas.isPending) {
      console.warn('Cannot add element: canvas creation in progress');
      return;
    }

    const newElement: CanvasElement = {
      id: `${type}-${Date.now()}`,
      type: type as CanvasElement['type'],
      position: { x: 100, y: 100 },
      content: {
        ...getDefaultContent(type),
      },
      size: getDefaultSize(type),
    };
    
    console.log('Created new element:', newElement.id);
    
    const newData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    console.log('Updating canvas data with new element');
    setCanvasData(newData);
    
    // Save immediately for new elements
    flushDataChange(newData);
    setSelectedElements([newElement.id]);
  };

  const handleAddKnowledgeItem = (itemId: string, itemData: any) => {
    const newElement: CanvasElement = {
      id: `knowledgeItem-${Date.now()}`,
      type: 'knowledgeItem' as any,
      position: { x: 100, y: 100 },
      size: { width: 140, height: 121 },
      content: {
        id: itemId, // Store the actual knowledge item database ID for edit links
        knowledgeItemId: itemId,
        name: itemData.name,
        slug: itemData.slug,
        // Use new multi-taxonomy arrays - get first item for display
        domain_color: itemData.domains?.[0]?.color || itemData.activity_domains?.color,
        domain_name: itemData.domains?.[0]?.name || itemData.activity_domains?.name,
        planning_focus_color: itemData.decision_levels?.[0]?.color || itemData.planning_focuses?.color,
        planning_focus_name: itemData.decision_levels?.[0]?.name || itemData.planning_focuses?.name,
        category_name: itemData.categories?.[0]?.name || itemData.knowledge_categories?.name,
        category_color: itemData.categories?.[0]?.color || itemData.knowledge_categories?.color,
        icon: itemData.icon,
        emoji: itemData.emoji,
      }
    };
    
    const newData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    setCanvasData(newData);
    flushDataChange(newData);
    setSelectedElements([newElement.id]);
  };

  const handleAddCustomHexi = () => {
    const newElement: CanvasElement = {
      id: `customHexi-${Date.now()}`,
      type: 'customHexi' as any,
      position: { x: 200, y: 100 },
      size: { width: 140, height: 121 },
      content: {
        label: 'New Hexagon',
        color: '#8B5CF6',
        icon: 'Circle',
        notes: '',
      }
    };
    
    const newData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    setCanvasData(newData);
    flushDataChange(newData);
    setSelectedElements([newElement.id]);
  };

  const handleAddPlanningFocus = (focusId: string, focusData: any) => {
    const newElement: CanvasElement = {
      id: `planningFocus-${Date.now()}`,
      type: 'planningFocus' as any,
      position: { x: 250, y: 150 },
      size: { width: 140, height: 121 },
      content: {
        planningFocusId: focusId,
        name: focusData.name,
        slug: focusData.slug,
        description: focusData.description,
        color: focusData.color,
        display_order: focusData.display_order,
      }
    };
    
    const newData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    setCanvasData(newData);
    flushDataChange(newData);
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

  const handleElementContentChange = (elementId: string, content: any) => {
    const newData = {
      ...canvasData,
      elements: canvasData.elements.map(el =>
        el.id === elementId ? { ...el, content } : el
      ),
    };
    setCanvasData(newData);
    debouncedDataChange(newData);
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
    
    // Temporarily reset zoom/pan and clear selection for export
    const originalZoom = zoom;
    const originalPan = pan;
    const prevSelected = selectedElements;
    
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedElements([]);
    
    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const dataUrl = await canvasRef.current.exportCanvas({ format: 'png', quality: 2 });
      const link = document.createElement('a');
      link.download = `${projectName}-canvas.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
    } finally {
      // Restore original zoom, pan, and selection
      setZoom(originalZoom);
      setPan(originalPan);
      setSelectedElements(prevSelected);
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
        // Update immediately for smooth dragging, debounce database saves
        const newData = {
          ...canvasData,
          elements: canvasData.elements.map(el =>
            el.id === element.id ? { ...el, position } : el
          ),
        };
        setCanvasData(newData);
        debouncedDataChange(newData);
      },
      onResize: (size: { width: number; height: number }) => {
        handleElementUpdate(element.id, { size });
      },
    };

    switch (element.type) {
      case 'bmc':
        return <BMCCanvasElement key={element.id} {...commonProps} />;
      case 'story':
        return (
          <StoryCardElement 
            key={element.id} 
            {...commonProps} 
            onDelete={() => handleElementDelete(element.id)}
          />
        );
      case 'sticky':
        return (
          <StickyNoteElement 
            key={element.id} 
            {...commonProps} 
            onContentChange={(content) => handleElementContentChange(element.id, content)}
            onDelete={() => handleElementDelete(element.id)}
          />
        );
      case 'knowledgeItem':
        return (
          <KnowledgeItemHexiElement
            key={element.id}
            id={element.id}
            position={element.position}
            size={element.size}
            knowledgeItemId={element.content.knowledgeItemId}
            data={element.content}
            isSelected={isSelected}
            onSelect={() => setSelectedElements([element.id])}
            onMove={(position) => {
              const newData = {
                ...canvasData,
                elements: canvasData.elements.map(el =>
                  el.id === element.id ? { ...el, position } : el
                ),
              };
              setCanvasData(newData);
              debouncedDataChange(newData);
            }}
            onDelete={() => handleElementDelete(element.id)}
          />
        );
      case 'customHexi':
        return (
          <CustomHexiElement
            key={element.id}
            id={element.id}
            position={element.position}
            size={element.size}
            data={element.content}
            isSelected={isSelected}
            onSelect={() => setSelectedElements([element.id])}
            onMove={(position) => {
              const newData = {
                ...canvasData,
                elements: canvasData.elements.map(el =>
                  el.id === element.id ? { ...el, position } : el
                ),
              };
              setCanvasData(newData);
              debouncedDataChange(newData);
            }}
            onContentChange={(content) => handleElementContentChange(element.id, content)}
            onDelete={() => handleElementDelete(element.id)}
          />
        );
      case 'planningFocus':
        return (
          <PlanningFocusHexiElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => setSelectedElements([element.id])}
            onUpdate={(updates) => handleElementUpdate(element.id, updates)}
            onDelete={() => handleElementDelete(element.id)}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading || createCanvas.isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mr-4"></div>
        <div className="text-muted-foreground">
          {isLoading ? 'Loading canvas...' : 'Creating canvas...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-2">Failed to load canvas</div>
          <div className="text-sm text-muted-foreground mb-4">{error.message}</div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CanvasProvider>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard?tab=projects')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">{projectName}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Toolbar 
              onAddElement={handleAddElement}
              onZoomIn={() => handleZoom('in')}
              onZoomOut={() => handleZoom('out')}
              onExport={handleExport}
              zoom={zoom}
              projectId={projectId}
              onAddKnowledgeItem={handleAddKnowledgeItem}
              onAddCustomHexi={handleAddCustomHexi}
              onAddPlanningFocus={handleAddPlanningFocus}
              existingKnowledgeItemIds={existingKnowledgeItemIds}
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
        text: 'New note',
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
    case 'knowledgeItem':
    case 'customHexi':
    case 'planningFocus':
      return { width: 140, height: 121 };
    default:
      return { width: 200, height: 150 };
  }
}