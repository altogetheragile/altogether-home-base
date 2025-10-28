import React, { useState, useRef, useCallback, useEffect } from 'react';
import BaseCanvas, { CanvasData, CanvasElement, BaseCanvasRef } from './BaseCanvas';
import { StoryToolbar } from './StoryToolbar';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCanvas, useCanvasMutations } from '@/hooks/useCanvas';
import { useDebounceCanvas } from '@/hooks/useDebounceCanvas';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { StoryCardElement } from './elements/StoryCardElement';
import { type UserStory, type Epic, type Feature } from '@/hooks/useUserStories';
import { UserStoryClarifierDialog } from '@/components/stories/UserStoryClarifierDialog';
import { StoryEditDialog } from '@/components/stories/StoryEditDialog';
import { useAIStoryGeneration } from '@/hooks/useAIStoryGeneration';
import { mapGeneratedStoryToUserStory, mapGeneratedEpicToEpic, mapGeneratedFeatureToFeature } from '@/utils/storyMetadata';

interface UserStoryCanvasProps {
  projectName?: string;
}

const UserStoryCanvas: React.FC<UserStoryCanvasProps> = ({
  projectName = 'User Story Canvas',
}) => {
  const [canvasData, setCanvasData] = useState<CanvasData>({ elements: [] });
  const [zoom, setZoom] = useState(1);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [editingStory, setEditingStory] = useState<{ story: UserStory | Epic | null; type: 'story' | 'epic'; elementId: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const canvasRef = useRef<BaseCanvasRef>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { updateCanvas, createCanvas } = useCanvasMutations();
  
  // Use user-scoped canvas instead of project-scoped
  const { data: savedCanvas } = useCanvas(undefined, user?.id, 'user-story');

  // Load saved canvas data
  useEffect(() => {
    if (savedCanvas?.data) {
      setCanvasData(savedCanvas.data);
    }
  }, [savedCanvas]);

  // Auto-save with debouncing
  const handleCanvasSave = useCallback(async (data: CanvasData) => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      if (savedCanvas) {
        await updateCanvas.mutateAsync({ 
          canvasId: savedCanvas.id,
          userId: user.id, 
          canvasType: 'user-story', 
          data 
        });
      } else {
        await createCanvas.mutateAsync({ 
          userId: user.id, 
          canvasType: 'user-story', 
          data 
        });
      }
    } catch (error) {
      console.error('Failed to save canvas:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, savedCanvas, updateCanvas, createCanvas]);

  const { debouncedCallback } = useDebounceCanvas(handleCanvasSave, 500);

  const handleDataChange = useCallback((data: CanvasData) => {
    setCanvasData(data);
    debouncedCallback(data);
  }, [debouncedCallback]);

  // Calculate smart grid position for new elements
  const calculateGridPosition = useCallback((
    storyLevel: 'epic' | 'feature' | 'story' | 'task'
  ) => {
    const GRID_SIZE = 220;
    const LEVEL_OFFSETS = {
      epic: { x: 50, y: 50 },
      feature: { x: 50, y: 50 },
      story: { x: 50, y: 50 },
      task: { x: 50, y: 50 },
    };

    const sameLevelElements = canvasData.elements.filter(
      e => e.metadata?.storyLevel === storyLevel
    );

    const row = Math.floor(sameLevelElements.length / 4);
    const col = sameLevelElements.length % 4;

    return {
      x: LEVEL_OFFSETS[storyLevel].x + (col * GRID_SIZE),
      y: LEVEL_OFFSETS[storyLevel].y + (row * GRID_SIZE),
    };
  }, [canvasData.elements]);

  // Handle adding story to canvas
  const handleAddStory = useCallback((
    level: 'epic' | 'feature' | 'story' | 'task',
    data?: Partial<UserStory | Epic | Feature>
  ) => {
    const position = calculateGridPosition(level);
    
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'story' as any,
      position,
      size: { width: 200, height: 160 },
      content: {
        title: `New ${level.charAt(0).toUpperCase() + level.slice(1)}`,
        description: '',
        status: 'draft',
        priority: level === 'story' || level === 'task' ? 'medium' : undefined,
        storyPoints: level === 'story' || level === 'task' ? 0 : undefined,
        ...data,
      },
      metadata: {
        storyLevel: level,
      },
    };

    const updatedData = {
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    };
    
    handleDataChange(updatedData);
    
    toast({
      title: "Added to Canvas",
      description: `${level.charAt(0).toUpperCase() + level.slice(1)} added to your canvas`,
    });
  }, [canvasData, calculateGridPosition, handleDataChange, toast]);

  // Handle AI generation
  const { generateStoryAsync } = useAIStoryGeneration();

  const handleStoryGenerated = useCallback(async (input: string, level: 'epic' | 'feature' | 'story') => {
    try {
      const result = await generateStoryAsync({
        userInput: input,
        storyLevel: level,
      });

      if (result) {
        let mappedData;
        if (level === 'epic') {
          mappedData = mapGeneratedEpicToEpic(result as any);
        } else if (level === 'feature') {
          mappedData = mapGeneratedFeatureToFeature(result as any);
        } else {
          mappedData = mapGeneratedStoryToUserStory(result as any);
        }

        handleAddStory(level, mappedData);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    }
  }, [generateStoryAsync, handleAddStory]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleShowAll = useCallback(() => {
    if (canvasData.elements.length === 0) {
      toast({
        title: "No Elements",
        description: "Add some elements to the canvas first",
      });
      return;
    }

    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    canvasData.elements.forEach(el => {
      const left = el.position.x;
      const top = el.position.y;
      const right = left + (el.size?.width || 200);
      const bottom = top + (el.size?.height || 160);
      
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // Add padding
    const padding = 50;
    const contentWidth = maxX - minX + (padding * 2);
    const contentHeight = maxY - minY + (padding * 2);

    // Calculate zoom to fit (assuming canvas container is roughly viewport size)
    const viewportWidth = window.innerWidth - 100;
    const viewportHeight = window.innerHeight - 200;
    const zoomX = viewportWidth / contentWidth;
    const zoomY = viewportHeight / contentHeight;
    const optimalZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in more than 100%

    setZoom(Math.max(optimalZoom, 0.3)); // Ensure minimum zoom
    
    toast({
      title: "View Adjusted",
      description: `Showing all ${canvasData.elements.length} elements`,
    });
  }, [canvasData.elements, toast]);

  const handleExport = useCallback(async () => {
    try {
      const dataUrl = await canvasRef.current?.exportCanvas({ format: 'png' });
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `user-story-canvas-${Date.now()}.png`;
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

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElements.includes(element.id);
    
    const handleSelect = () => {
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

    const handleEdit = () => {
      const storyLevel = element.metadata?.storyLevel || 'story';
      const type = storyLevel === 'epic' ? 'epic' : 'story';
      setEditingStory({ story: element.content as any, type, elementId: element.id });
    };

    const handleDelete = () => {
      const updatedData = {
        ...canvasData,
        elements: canvasData.elements.filter(el => el.id !== element.id)
      };
      handleDataChange(updatedData);
      setSelectedElements([]);
    };

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
        onEdit={handleEdit}
        onDelete={handleDelete}
        storyLevel={element.metadata?.storyLevel}
      />
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{projectName}</h1>
            <p className="text-sm text-muted-foreground">
              Interactive canvas for epics, features, stories, and tasks
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-sm text-muted-foreground">Saving...</span>
          )}
          {user && (
            <Button onClick={() => handleCanvasSave(canvasData)}>
              <Save className="h-4 w-4 mr-2" />
              Save Now
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
        <StoryToolbar
          onAddStory={handleAddStory}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onShowAll={handleShowAll}
          onExport={handleExport}
          onGenerateAI={() => setShowAIDialog(true)}
          zoom={zoom}
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
                    Welcome to User Story Canvas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add epics, features, stories, or tasks to your canvas. Use AI to generate them or create manually. Drag to reposition.
                  </p>
                </div>
              </div>
            )}
          </div>
        </BaseCanvas>
      </div>

      {/* Dialogs */}
      <UserStoryClarifierDialog
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
      />

      {editingStory && (
        <StoryEditDialog
          isOpen={true}
          onClose={() => setEditingStory(null)}
          story={editingStory.story}
          type={editingStory.type}
          mode="canvas"
          onSave={(updatedData) => {
            const updatedElements = canvasData.elements.map(el => {
              if (el.id === editingStory.elementId) {
                return {
                  ...el,
                  content: {
                    ...el.content,
                    ...updatedData,
                  },
                };
              }
              return el;
            });
            
            handleDataChange({ ...canvasData, elements: updatedElements });
            setEditingStory(null);
          }}
        />
      )}
    </div>
  );
};

export default UserStoryCanvas;
