import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const { data: canvas, isLoading, error } = useCanvas(projectId);
  const { createCanvas, updateCanvas } = useCanvasMutations();
  const { toast } = useToast();
  const canvasRef = useRef<BaseCanvasRef>(null);
  
  const [canvasData, setCanvasData] = useState<{
    elements: CanvasElement[];
    metadata?: Record<string, any>;
    viewport?: { pan: { x: number; y: number }; zoom: number };
  }>({
    elements: [],
    metadata: {},
    viewport: undefined
  });
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const hasCentered = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        viewport: canvas.data.viewport, // Preserve viewport
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
      
      // Restore saved viewport if it exists
      if (normalized.viewport) {
        setPan(normalized.viewport.pan);
        setZoom(normalized.viewport.zoom);
        hasCentered.current = true; // Mark as centered to prevent auto-center
      }
      
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
      const initialData = { elements: [], metadata: {}, viewport: undefined };
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

  // Auto-center view on canvas elements when first loaded (only if no saved viewport)
  useEffect(() => {
    if (canvasData.elements.length > 0 && !hasCentered.current && !canvasData.viewport) {
      // Wait for next frame to ensure container has rendered with correct dimensions
      requestAnimationFrame(() => {
        const viewportWidth = containerRef.current?.clientWidth || window.innerWidth;
        const viewportHeight = containerRef.current?.clientHeight || window.innerHeight;
        
        // Only center if we have valid dimensions
        if (viewportWidth > 0 && viewportHeight > 0) {
          // Calculate bounding box of all elements
          const positions = canvasData.elements.map(el => el.position);
          const minX = Math.min(...positions.map(p => p.x));
          const maxX = Math.max(...positions.map(p => p.x));
          const minY = Math.min(...positions.map(p => p.y));
          const maxY = Math.max(...positions.map(p => p.y));
          
          // Calculate content dimensions (including element sizes)
          const contentWidth = maxX - minX + 140; // +140 for hexi width
          const contentHeight = maxY - minY + 121; // +121 for hexi height
          
          // Calculate zoom to fit with padding
          const zoomX = (viewportWidth * 0.8) / contentWidth;
          const zoomY = (viewportHeight * 0.8) / contentHeight;
          const fitZoom = Math.min(zoomX, zoomY, 1.0); // Cap at 1.0
          
          // Center of content
          const centerX = (maxX + minX) / 2 + 70; // +70 for half hexi width
          const centerY = (maxY + minY) / 2 + 60; // +60 for half hexi height
          
          // Pan to center content in viewport
          const newPanX = viewportWidth / 2 - centerX * fitZoom;
          const newPanY = viewportHeight / 2 - centerY * fitZoom;
          
          setPan({ x: newPanX, y: newPanY });
          setZoom(fitZoom);
          hasCentered.current = true;
        }
      });
    }
  }, [canvasData.elements.length, canvasData.viewport]);

  // Save viewport state to database when pan/zoom changes
  useEffect(() => {
    // Debounce viewport saves to avoid too many DB writes
    const timeoutId = setTimeout(() => {
      if (canvasData.elements.length > 0 && hasCentered.current) {
        setCanvasData(prev => ({
          ...prev,
          viewport: { pan, zoom }
        }));
      }
    }, 1000); // Save 1 second after last change
    
    return () => clearTimeout(timeoutId);
  }, [pan, zoom, canvasData.elements.length]);

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

    // Center new elements in visible viewport
    const viewportWidth = containerRef.current?.clientWidth || window.innerWidth;
    const viewportHeight = containerRef.current?.clientHeight || window.innerHeight;
    const defaultSize = getDefaultSize(type);
    
    // Calculate center of visible viewport in canvas coordinates
    const viewportCenterX = (viewportWidth / 2 - pan.x) / zoom;
    const viewportCenterY = (viewportHeight / 2 - pan.y) / zoom;
    
    const halfWidth = defaultSize.width / 2;
    const halfHeight = defaultSize.height / 2;
    
    // Ensure minimum position of 100,100 for safety
    const safeX = Math.max(100, viewportCenterX - halfWidth);
    const safeY = Math.max(100, viewportCenterY - halfHeight);
    
    const newElement: CanvasElement = {
      id: `${type}-${Date.now()}`,
      type: type as CanvasElement['type'],
      position: { 
        x: safeX,
        y: safeY
      },
      content: {
        ...getDefaultContent(type),
      },
      size: defaultSize,
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
    // Initialize technique-specific content if this is a technique hexi
    let techniqueContent = {};
    if (itemData.techniqueType === 'bmc') {
      techniqueContent = {
        bmcData: {
          keyPartners: '',
          keyActivities: '',
          keyResources: '',
          valuePropositions: '',
          customerRelationships: '',
          channels: '',
          customerSegments: '',
          costStructure: '',
          revenueStreams: '',
        }
      };
    } else if (itemData.techniqueType === 'userStory') {
      techniqueContent = {
        stories: []
      };
    }

    // Calculate staggered position based on existing elements count
    const existingCount = canvasData.elements.length;
    const position = {
      x: 100 + (existingCount * 160),
      y: 100 + ((existingCount % 3) * 140)
    };

    const newElement: CanvasElement = {
      id: `knowledgeItem-${Date.now()}`,
      type: 'knowledgeItem' as any,
      position,
      size: { width: 140, height: 121 },
      content: {
        knowledgeItemId: itemId,
        name: itemData.name,
        slug: itemData.slug,
        domain_color: itemData.activity_domains?.color,
        domain_name: itemData.activity_domains?.name,
        planning_focus_color: itemData.planning_focuses?.color,
        planning_focus_name: itemData.planning_focuses?.name,
        category_name: itemData.knowledge_categories?.name,
        category_color: itemData.knowledge_categories?.color,
        icon: itemData.icon,
        emoji: itemData.emoji,
        hasAISupport: itemData.has_ai_support || !!itemData.techniqueType,
        techniqueType: itemData.techniqueType,
        openAsTab: false, // User must explicitly open as tab
        ...techniqueContent,
      }
    };
    
    const newData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    setCanvasData(newData);
    flushDataChange(newData);
    setSelectedElements([newElement.id]);

    toast({
      title: "Hexi added",
      description: `${itemData.name} has been added to the canvas`,
    });
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

  const handleOpenAsTab = (elementId: string) => {
    const element = canvasData.elements.find(el => el.id === elementId);
    if (!element || element.type !== 'knowledgeItem') return;

    const newOpenAsTab = !element.content?.openAsTab;
    
    const newData = {
      ...canvasData,
      elements: canvasData.elements.map(el =>
        el.id === elementId 
          ? { ...el, content: { ...el.content, openAsTab: newOpenAsTab } }
          : el
      ),
    };
    
    handleDataChange(newData);
    
    toast({
      title: newOpenAsTab ? "Tab opened" : "Tab closed",
      description: newOpenAsTab 
        ? `${element.content?.name} is now available as a tab`
        : `${element.content?.name} tab has been closed`,
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.1, Math.min(3, newZoom));
    });
  };

  const handleResetView = () => {
    if (canvasData.elements.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1.0);
      return;
    }
    
    const viewportWidth = containerRef.current?.clientWidth || window.innerWidth;
    const viewportHeight = containerRef.current?.clientHeight || window.innerHeight;
    
    const positions = canvasData.elements.map(el => el.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    // Calculate content dimensions
    const contentWidth = maxX - minX + 140;
    const contentHeight = maxY - minY + 121;
    
    // Calculate zoom to fit with padding
    const zoomX = (viewportWidth * 0.8) / contentWidth;
    const zoomY = (viewportHeight * 0.8) / contentHeight;
    const fitZoom = Math.min(zoomX, zoomY, 1.0);
    
    // Center of content
    const centerX = (maxX + minX) / 2 + 70;
    const centerY = (maxY + minY) / 2 + 60;
    
    // Pan to center content in viewport
    const newPanX = viewportWidth / 2 - centerX * fitZoom;
    const newPanY = viewportHeight / 2 - centerY * fitZoom;
    
    setPan({ x: newPanX, y: newPanY });
    setZoom(fitZoom);
  };

  const handleNormalizePositions = () => {
    if (canvasData.elements.length === 0) {
      toast({
        title: "No elements to normalize",
        variant: "default",
      });
      return;
    }
    
    // Find minimum positions
    const positions = canvasData.elements.map(el => el.position);
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    
    // Shift all elements to positive coordinates with padding
    const padding = 100;
    const offset = {
      x: minX < padding ? padding - minX : 0,
      y: minY < padding ? padding - minY : 0
    };
    
    if (offset.x > 0 || offset.y > 0) {
      const normalizedElements = canvasData.elements.map(el => ({
        ...el,
        position: {
          x: el.position.x + offset.x,
          y: el.position.y + offset.y
        }
      }));
      
      setCanvasData({
        ...canvasData,
        elements: normalizedElements,
        viewport: undefined // Clear viewport to trigger re-center
      });
      
      hasCentered.current = false; // Allow re-center
      toast({
        title: "Canvas positions normalized",
        description: `Shifted ${canvasData.elements.length} elements to positive coordinates`,
      });
    } else {
      toast({
        title: "Positions already normalized",
        description: "All elements are already in valid positions",
        variant: "default",
      });
    }
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
            onContentChange={(content) => handleElementContentChange(element.id, content)}
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
            onOpenAsTab={() => handleOpenAsTab(element.id)}
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
      case 'userStory':
        return (
          <CustomHexiElement
            key={element.id}
            id={element.id}
            position={element.position}
            size={element.size}
            data={{
              label: 'Product Backlog',
              color: '#10B981',
              icon: 'ListTodo',
              notes: 'Click the Product Backlog tab to manage your stories'
            }}
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
      <div className="flex-1 min-h-0 bg-background flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-end p-4 border-b bg-card">
          <Toolbar 
            onAddElement={handleAddElement}
            onZoomIn={() => handleZoom('in')}
            onZoomOut={() => handleZoom('out')}
            onResetView={handleResetView}
            onNormalizePositions={handleNormalizePositions}
            onExport={handleExport}
            zoom={zoom}
            onAddKnowledgeItem={handleAddKnowledgeItem}
            onAddPlanningFocus={handleAddPlanningFocus}
            existingKnowledgeItemIds={existingKnowledgeItemIds}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-[640px] relative" ref={containerRef}>
          <div 
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            className="w-full h-full min-h-[640px]"
          >
            <BaseCanvas
              ref={canvasRef}
              data={canvasData}
              onDataChange={handleDataChange}
              className="w-full h-full min-h-[640px]"
            >
              {canvasData.elements.map((element) => renderElement(element))}
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