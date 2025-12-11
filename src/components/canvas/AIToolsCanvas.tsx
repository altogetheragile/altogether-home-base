import React, { useState, useRef, useCallback } from 'react';
import BaseCanvas, { CanvasData, CanvasElement, BaseCanvasRef } from './BaseCanvas';
import { AIToolbar } from './AIToolbar';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectMutations } from '@/hooks/useProjects';
import { useCanvasMutations } from '@/hooks/useCanvas';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import BMCCanvasElement from './elements/BMCCanvasElement';
import { StoryCardElement } from './elements/StoryCardElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { useLocalBacklogItems, LocalBacklogItemInput } from '@/hooks/useLocalBacklogItems';
import { CanvasStoryEditDialog, StoryEditData } from './elements/CanvasStoryEditDialog';

interface AIToolsCanvasProps {
  projectId?: string;
  projectName?: string;
  initialData?: CanvasData;
  onSave?: (data: CanvasData) => void;
}

const AIToolsCanvas: React.FC<AIToolsCanvasProps> = ({
  projectId,
  projectName,
  initialData,
  onSave,
}) => {
  const [canvasData, setCanvasData] = useState<CanvasData>(
    initialData || { elements: [] }
  );
  const [zoom, setZoom] = useState(1);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);
  const canvasRef = useRef<BaseCanvasRef>(null);
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addItem: addBacklogItem } = useLocalBacklogItems();

  const handleAddToBacklog = useCallback((storyData: any) => {
    const backlogItem: LocalBacklogItemInput = {
      title: storyData.title || 'Untitled Story',
      description: storyData.story || storyData.description || null,
      priority: storyData.priority || 'medium',
      status: 'new',
      source: 'AI Tools Canvas',
      estimated_value: null,
      estimated_effort: storyData.storyPoints || null,
      tags: null,
      target_release: null,
    };

    addBacklogItem(backlogItem);
    
    toast({
      title: "Added to Backlog",
      description: `"${backlogItem.title}" has been added to your Product Backlog`,
    });
  }, [addBacklogItem, toast]);

  const handleDataChange = useCallback((data: CanvasData) => {
    setCanvasData(data);
    onSave?.(data);
  }, [onSave]);

  const handleAddStoryFromGenerator = useCallback((storyData: any) => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'story' as any,
      position: { 
        x: 100 + (canvasData.elements.length * 20), 
        y: 100 + (canvasData.elements.length * 20) 
      },
      size: { width: 300, height: 200 },
      content: storyData,
    };

    const updatedData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    handleDataChange(updatedData);
    
    toast({
      title: "User Story Added to Canvas",
      description: `${storyData.title} has been added to your canvas`,
    });
  }, [canvasData, handleDataChange, toast]);

  const handleAddElement = useCallback((type: string) => {
    // Calculate element size
    const elementWidth = type === 'bmc' ? 800 : type === 'story' ? 300 : 140;
    const elementHeight = type === 'bmc' ? 600 : type === 'story' ? 200 : 121;
    
    // Center the element in a typical viewport (assuming ~1200x700 canvas area)
    // and offset slightly for multiple elements
    const offset = canvasData.elements.length * 20;
    const centerX = (1200 - elementWidth) / 2 + offset;
    const centerY = (700 - elementHeight) / 2 + offset;
    
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: type as any,
      position: { 
        x: Math.max(50, centerX), 
        y: Math.max(50, centerY) 
      },
      size: { 
        width: elementWidth, 
        height: elementHeight 
      },
      content: getDefaultContent(type),
    };

    const updatedData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    handleDataChange(updatedData);
    
    toast({
      title: "Element Added",
      description: `${getElementDisplayName(type)} has been added to the canvas`,
    });
  }, [canvasData, handleDataChange, toast]);

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'bmc':
        return {
          companyName: 'New Company',
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
      case 'story':
        return {
          title: 'New User Story',
          description: 'As a user, I want to...',
          acceptanceCriteria: [],
          priority: 'medium',
          storyPoints: 0,
        };
      case 'sticky':
        return {
          text: 'New sticky note',
          color: '#FFE066',
        };
      default:
        return {};
    }
  };

  const getElementDisplayName = (type: string) => {
    switch (type) {
      case 'bmc':
        return 'Business Model Canvas';
      case 'story':
        return 'User Story';
      case 'sticky':
        return 'Sticky Note';
      default:
        return 'Element';
    }
  };

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const dataUrl = await canvasRef.current?.exportCanvas({ format: 'png' });
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `ai-tools-canvas-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
        toast({
          title: "Canvas Exported",
          description: "Your canvas has been exported as PNG",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export canvas",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSaveToProject = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your canvas",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setSaveDialogOpen(true);
  };

  const handleSaveComplete = (projectId: string, artifactId: string) => {
    toast({
      title: "🎉 Canvas Saved!",
      description: "Your canvas has been saved to the project"
    });
    navigate(`/projects/${projectId}`);
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElements.includes(element.id);
    
    const handleSelect = () => {
      console.log('Selecting element:', element.id);
      setSelectedElements([element.id]);
    };
    const handleMove = (position: { x: number; y: number }) => {
      const updatedElement = { ...element, position };
      const updatedData = {
        ...canvasData,
        elements: canvasData.elements.map(el => 
          el.id === element.id ? updatedElement : el
        ),
      };
      handleDataChange(updatedData);
    };
    const handleResize = (size: { width: number; height: number }) => {
      const updatedElement = { ...element, size };
      const updatedData = {
        ...canvasData,
        elements: canvasData.elements.map(el => 
          el.id === element.id ? updatedElement : el
        ),
      };
      handleDataChange(updatedData);
    };

    switch (element.type) {
      case 'bmc':
        return (
          <BMCCanvasElement 
            key={element.id}
            id={element.id}
            position={element.position}
            size={element.size}
            data={element.content}
            isSelected={isSelected}
            onSelect={handleSelect}
            onMove={handleMove}
            onResize={handleResize}
            showWatermark={!user}
            onContentChange={(newContent) => {
              const updatedElement = { ...element, content: newContent };
              const updatedData = {
                ...canvasData,
                elements: canvasData.elements.map(el => 
                  el.id === element.id ? updatedElement : el
                ),
              };
              handleDataChange(updatedData);
            }}
            onDelete={() => {
              const updatedData = {
                ...canvasData,
                elements: canvasData.elements.filter(el => el.id !== element.id)
              };
              handleDataChange(updatedData);
              setSelectedElements([]);
            }}
          />
        );
      case 'story':
        return (
          <StoryCardElement 
            key={element.id}
            id={element.id}
            position={element.position}
            size={element.size}
            data={element.content}
            isSelected={isSelected}
            onSelect={handleSelect}
            onMove={handleMove}
            onResize={handleResize}
            onContentChange={(newContent) => {
              const updatedElement = { ...element, content: newContent };
              const updatedData = {
                ...canvasData,
                elements: canvasData.elements.map(el => 
                  el.id === element.id ? updatedElement : el
                ),
              };
              handleDataChange(updatedData);
            }}
            onDelete={() => {
              const updatedData = {
                ...canvasData,
                elements: canvasData.elements.filter(el => el.id !== element.id)
              };
              handleDataChange(updatedData);
              setSelectedElements([]);
            }}
            onAddToBacklog={() => handleAddToBacklog(element.content)}
            onEdit={() => setEditingElement(element)}
          />
        );
      case 'sticky':
        return (
          <StickyNoteElement 
            key={element.id}
            id={element.id}
            position={element.position}
            size={element.size}
            data={element.content}
            isSelected={isSelected}
            onSelect={handleSelect}
            onMove={handleMove}
            onResize={handleResize}
            onContentChange={(newContent) => {
              const updatedElement = { ...element, content: newContent };
              const updatedData = {
                ...canvasData,
                elements: canvasData.elements.map(el => 
                  el.id === element.id ? updatedElement : el
                ),
              };
              handleDataChange(updatedData);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xl font-bold text-primary hover:text-primary/80 transition-colors">
            AltogetherAgile
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(preselectedProjectId ? `/projects/${preselectedProjectId}` : '/ai-tools')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {preselectedProjectId ? 'Back to Project' : 'Back to AI Tools'}
          </Button>
          <div>
            <h1 className="text-xl font-semibold">AI Tools Canvas</h1>
            <p className="text-sm text-muted-foreground">
              Generate AI-powered Business Model Canvases and strategic frameworks
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <Button onClick={handleSaveToProject}>
              <Save className="h-4 w-4 mr-2" />
              Save to Project
            </Button>
          )}
          {!user && (
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
            >
              Sign In to Save
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b px-4 py-2 bg-card/50">
        <AIToolbar
          onAddElement={handleAddElement}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onExport={handleExport}
          zoom={zoom}
          onStoryGenerated={handleAddStoryFromGenerator}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <BaseCanvas
          ref={canvasRef}
          data={canvasData}
          onDataChange={handleDataChange}
          isEditable={true}
          className="w-full h-full"
        >
          <div 
            className="relative w-full h-full"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left',
            }}
          >
            {canvasData.elements.map(renderElement)}
            
            {/* Empty State */}
            {canvasData.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Welcome to AI Tools Canvas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Generate BMC" to create AI-powered Business Model Canvases using strategic frameworks from our Knowledge Base. Add sticky notes for additional context.
                  </p>
                </div>
              </div>
            )}
          </div>
        </BaseCanvas>
      </div>

      {/* Save to Project Dialog */}
      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="canvas"
        artifactName="User Story Canvas"
        artifactDescription={`Canvas with ${canvasData.elements.length} elements`}
        artifactData={canvasData}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />

      {/* Story Edit Dialog */}
      <CanvasStoryEditDialog
        open={!!editingElement && editingElement.type === 'story'}
        onOpenChange={(open) => !open && setEditingElement(null)}
        data={editingElement?.content as StoryEditData}
        onSave={(newData) => {
          if (editingElement) {
            const updatedData = {
              ...canvasData,
              elements: canvasData.elements.map((el) =>
                el.id === editingElement.id ? { ...el, content: newData } : el
              ),
            };
            handleDataChange(updatedData);
            setEditingElement(null);
          }
        }}
      />
    </div>
  );
};

export default AIToolsCanvas;