import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AIToolbar, SaveStatus } from './AIToolbar';
import { Button } from '@/components/ui/button';
import { Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import BMCCanvasElement from './elements/BMCCanvasElement';
import { StoryCardElement } from './elements/StoryCardElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { useCreateBacklogItem } from '@/hooks/useBacklogItems';
import { UnifiedStoryEditDialog } from '@/components/stories';
import { SplitStoryDialog } from '@/components/stories/SplitStoryDialog';
import { UnifiedStoryData } from '@/types/story';
import { useDebouncedCallback } from 'use-debounce';

// Adapter to convert canvas story data to UnifiedStoryData
const canvasToUnifiedData = (content: any): UnifiedStoryData => ({
  title: content?.title || '',
  description: content?.story || content?.description || '',
  acceptance_criteria: content?.acceptanceCriteria || [],
  priority: content?.priority || 'medium',
  story_points: content?.storyPoints || null,
});

// Adapter to convert UnifiedStoryData back to canvas format
const unifiedToCanvasData = (data: UnifiedStoryData) => ({
  title: data.title,
  story: data.description,
  description: data.description,
  acceptanceCriteria: data.acceptance_criteria || [],
  priority: data.priority || 'medium',
  storyPoints: data.story_points || 0,
});
import html2canvas from 'html2canvas';

interface CanvasElement {
  id: string;
  type: 'bmc' | 'story' | 'sticky';
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
}

interface CanvasData {
  elements: CanvasElement[];
}

interface AIToolsCanvasProps {
  projectId?: string;
  projectName?: string;
  initialData?: CanvasData;
  artifactId?: string;
  onSave?: (data: CanvasData) => void;
}

const AIToolsCanvas: React.FC<AIToolsCanvasProps> = ({
  projectId,
  projectName,
  initialData,
  artifactId,
  onSave,
}) => {
  // Element state
  const [elements, setElements] = useState<CanvasElement[]>(initialData?.elements || []);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);
  const [splittingElement, setSplittingElement] = useState<CanvasElement | null>(null);
  
  // Undo/Redo history
  const [history, setHistory] = useState<CanvasElement[][]>([initialData?.elements || []]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });
  
  // Group drag state
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [groupDragDelta, setGroupDragDelta] = useState({ dx: 0, dy: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const wasMarqueeSelectingRef = useRef(false);
  
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createBacklogItem = useCreateBacklogItem();
  const { updateArtifact } = useProjectArtifactMutations();

  // Undo/Redo computed values
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Clean up stale selections when elements change
  useEffect(() => {
    const elementIds = new Set(elements.map(el => el.id));
    setSelectedElementIds(prev => {
      const filtered = prev.filter(id => elementIds.has(id));
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, [elements]);

  // History-aware element update function
  const updateElementsWithHistory = useCallback((newElements: CanvasElement[]) => {
    setElements(newElements);
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newElements);
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [canUndo, history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  }, [canRedo, history, historyIndex]);

  const handleAddToBacklog = useCallback(async (storyData: any) => {
    const targetProjectId = projectId || preselectedProjectId;
    
    if (!targetProjectId) {
      toast({
        title: "Cannot Add to Backlog",
        description: "This canvas is not associated with a project. Save it to a project first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBacklogItem.mutateAsync({
        project_id: targetProjectId,
        title: storyData.title || 'Untitled Story',
        description: storyData.story || storyData.description || null,
        priority: storyData.priority || 'Medium',
        status: 'New',
        source: 'User Story Canvas',
        estimated_value: null,
        estimated_effort: storyData.storyPoints || null,
        tags: null,
        target_release: null,
        acceptance_criteria: storyData.acceptanceCriteria || null,
      });
    } catch (error) {
      // Error toast is handled by the hook
    }
  }, [createBacklogItem, projectId, preselectedProjectId, toast]);

  const handleAddElement = useCallback((type: string) => {
    const elementWidth = type === 'bmc' ? 800 : type === 'story' ? 300 : 200;
    const elementHeight = type === 'bmc' ? 600 : type === 'story' ? 180 : 200;
    
    const offset = elements.length * 20;
    const centerX = (1200 - elementWidth) / 2 + offset;
    const centerY = (700 - elementHeight) / 2 + offset;
    
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: type as any,
      position: { 
        x: Math.max(50, centerX), 
        y: Math.max(50, centerY) 
      },
      size: { width: elementWidth, height: elementHeight },
      content: getDefaultContent(type),
    };

    updateElementsWithHistory([...elements, newElement]);
    
    toast({
      title: "Element Added",
      description: `${getElementDisplayName(type)} has been added to the canvas`,
    });
  }, [elements, updateElementsWithHistory, toast]);

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'bmc':
        return {
          companyName: 'New Company',
          bmcData: {
            keyPartners: '', keyActivities: '', keyResources: '',
            valuePropositions: '', customerRelationships: '', channels: '',
            customerSegments: '', costStructure: '', revenueStreams: '',
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
        return { text: 'New note', color: '#FFE066' };
      default:
        return {};
    }
  };

  const getElementDisplayName = (type: string) => {
    switch (type) {
      case 'bmc': return 'Business Model Canvas';
      case 'story': return 'User Story';
      case 'sticky': return 'Sticky Note';
      default: return 'Element';
    }
  };

  // Element handlers
  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        let newUpdates = { ...updates };
        if (newUpdates.position) {
          newUpdates.position = {
            x: Math.max(0, newUpdates.position.x),
            y: Math.max(0, newUpdates.position.y),
          };
        }
        return { ...el, ...newUpdates };
      }
      return el;
    }));
  }, []);

  const handleElementDelete = useCallback((id: string) => {
    updateElementsWithHistory(elements.filter(el => el.id !== id));
    setSelectedElementIds(prev => prev.filter(eid => eid !== id));
    toast({ title: 'Element deleted' });
  }, [elements, updateElementsWithHistory, toast]);

  const handleElementSelect = useCallback((id: string, shiftKey: boolean = false, preserveIfSelected: boolean = false) => {
    if (shiftKey) {
      setSelectedElementIds(prev => 
        prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
      );
    } else if (preserveIfSelected) {
      setSelectedElementIds(prev => prev.includes(id) ? prev : [id]);
    } else {
      setSelectedElementIds([id]);
    }
  }, []);

  const handleDuplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const newElement: CanvasElement = {
      ...element,
      id: crypto.randomUUID(),
      content: JSON.parse(JSON.stringify(element.content)),
      position: { x: element.position.x + 30, y: element.position.y + 30 },
    };
    updateElementsWithHistory([...elements, newElement]);
    toast({ title: 'Element duplicated' });
  }, [elements, updateElementsWithHistory, toast]);

  // Group drag handlers
  const handleGroupDragStart = useCallback(() => {
    if (selectedElementIds.length > 1) {
      setIsDraggingGroup(true);
      setGroupDragDelta({ dx: 0, dy: 0 });
    }
  }, [selectedElementIds.length]);

  const handleGroupDragProgress = useCallback((delta: { dx: number; dy: number }) => {
    if (selectedElementIds.length > 1) {
      let minX = Infinity, minY = Infinity;
      elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
          minX = Math.min(minX, el.position.x);
          minY = Math.min(minY, el.position.y);
        }
      });
      setGroupDragDelta({
        dx: Math.max(delta.dx, -minX),
        dy: Math.max(delta.dy, -minY),
      });
    }
  }, [selectedElementIds, elements]);

  const handleGroupMove = useCallback((draggedId: string, delta: { dx: number; dy: number }) => {
    setIsDraggingGroup(false);
    setGroupDragDelta({ dx: 0, dy: 0 });
    
    let minX = Infinity, minY = Infinity;
    elements.forEach(el => {
      if (selectedElementIds.includes(el.id)) {
        minX = Math.min(minX, el.position.x);
        minY = Math.min(minY, el.position.y);
      }
    });
    
    const clampedDelta = {
      dx: Math.max(delta.dx, -minX),
      dy: Math.max(delta.dy, -minY),
    };
    
    const updatedElements = elements.map(el => {
      if (selectedElementIds.includes(el.id)) {
        return {
          ...el,
          position: {
            x: el.position.x + clampedDelta.dx,
            y: el.position.y + clampedDelta.dy,
          },
        };
      }
      return el;
    });
    updateElementsWithHistory(updatedElements);
  }, [selectedElementIds, elements, updateElementsWithHistory]);

  const getVisualPosition = useCallback((element: CanvasElement) => {
    if (isDraggingGroup && selectedElementIds.includes(element.id)) {
      return {
        x: element.position.x + groupDragDelta.dx,
        y: element.position.y + groupDragDelta.dy,
      };
    }
    return element.position;
  }, [isDraggingGroup, groupDragDelta, selectedElementIds]);

  // Marquee selection
  const isElementInSelectionBox = useCallback((element: CanvasElement, box: { left: number; top: number; right: number; bottom: number }) => {
    const { x, y } = element.position;
    const { width, height } = element.size;
    return x < box.right && x + width > box.left && y < box.bottom && y + height > box.top;
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    // Check if we clicked on an actual canvas element
    const target = e.target as HTMLElement;
    const clickedElement = target.closest('[data-element-id]');
    if (clickedElement) return;
    
    canvasRef.current?.focus({ preventScroll: true });
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setIsMarqueeSelecting(true);
    setMarqueeStart({ x, y });
    setMarqueeEnd({ x, y });
    
    if (!e.shiftKey) {
      setSelectedElementIds([]);
    }
  }, [zoom]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMarqueeSelecting) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setMarqueeEnd({ x, y });
  }, [isMarqueeSelecting, zoom]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isMarqueeSelecting) return;
    
    wasMarqueeSelectingRef.current = true;
    setTimeout(() => { wasMarqueeSelectingRef.current = false; }, 0);
    
    const box = {
      left: Math.min(marqueeStart.x, marqueeEnd.x),
      top: Math.min(marqueeStart.y, marqueeEnd.y),
      right: Math.max(marqueeStart.x, marqueeEnd.x),
      bottom: Math.max(marqueeStart.y, marqueeEnd.y),
    };
    
    const marqueeWidth = box.right - box.left;
    const marqueeHeight = box.bottom - box.top;
    
    if (marqueeWidth > 5 || marqueeHeight > 5) {
      const newSelected = elements.filter(el => isElementInSelectionBox(el, box)).map(el => el.id);
      
      if (e.shiftKey) {
        setSelectedElementIds(prev => [...new Set([...prev, ...newSelected])]);
      } else {
        setSelectedElementIds(newSelected);
      }
    }
    
    setIsMarqueeSelecting(false);
  }, [isMarqueeSelecting, marqueeStart, marqueeEnd, elements, isElementInSelectionBox]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedElementIds(elements.map(el => el.id));
        return;
      }
      if (e.key === 'Escape') {
        setSelectedElementIds([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, undo, redo]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.1, 2)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.1, 0.5)), []);

  // Export
  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      toast({ title: 'Generating export...' });
      const canvas = await html2canvas(canvasRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `ai-tools-canvas-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: 'Canvas exported!' });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  }, [toast]);

  // Auto-save
  const performAutoSave = useDebouncedCallback(async (elementsToSave: CanvasElement[]) => {
    if (!artifactId || !projectId) {
      onSave?.({ elements: elementsToSave });
      return;
    }
    
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({
        id: artifactId,
        updates: { data: { elements: elementsToSave } }
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, 2000);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    performAutoSave(elements);
  }, [elements]);

  const handleSaveToProject = () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to save", variant: "destructive" });
      navigate('/auth');
      return;
    }
    setSaveDialogOpen(true);
  };

  const handleSaveComplete = (projId: string) => {
    toast({ title: "Canvas Saved!", description: "Your canvas has been saved to the project" });
    navigate(`/projects/${projId}`);
  };

  // Canvas bounds
  const canvasBounds = useMemo(() => {
    const MIN_WIDTH = 2000, MIN_HEIGHT = 1500, PADDING = 500;
    if (elements.length === 0) return { width: MIN_WIDTH, height: MIN_HEIGHT };
    let maxX = 0, maxY = 0;
    elements.forEach(el => {
      maxX = Math.max(maxX, el.position.x + el.size.width);
      maxY = Math.max(maxY, el.position.y + el.size.height);
    });
    return { width: Math.max(MIN_WIDTH, maxX + PADDING), height: Math.max(MIN_HEIGHT, maxY + PADDING) };
  }, [elements]);

  // Render element
  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElementIds.includes(element.id);
    const isMultiSelected = isSelected && selectedElementIds.length > 1;
    const visualPosition = getVisualPosition(element);

    const commonProps = {
      key: element.id,
      id: element.id,
      position: visualPosition,
      size: element.size,
      isSelected,
      isMultiSelected,
      isMarqueeSelecting,
      onSelect: (e?: React.PointerEvent, preserveIfSelected?: boolean) => 
        handleElementSelect(element.id, e?.shiftKey || false, preserveIfSelected || false),
      onMove: (pos: { x: number; y: number }) => handleElementUpdate(element.id, { position: pos }),
      onMoveGroup: (delta: { dx: number; dy: number }) => handleGroupMove(element.id, delta),
      onGroupDragStart: handleGroupDragStart,
      onGroupDragProgress: handleGroupDragProgress,
      onDelete: () => handleElementDelete(element.id),
      onDuplicate: () => handleDuplicateElement(element.id),
    };

    switch (element.type) {
      case 'bmc':
        return (
          <BMCCanvasElement 
            {...commonProps}
            data={element.content}
            showWatermark={!user}
            onResize={(size) => handleElementUpdate(element.id, { size })}
            onContentChange={(content) => handleElementUpdate(element.id, { content })}
          />
        );
      case 'story':
        return (
          <StoryCardElement 
            {...commonProps}
            data={element.content}
            onEdit={() => setEditingElement(element)}
            onAddToBacklog={() => handleAddToBacklog(element.content)}
            onSplit={() => setSplittingElement(element)}
          />
        );
      case 'sticky':
        return (
          <StickyNoteElement 
            {...commonProps}
            data={element.content}
            onResize={(size) => handleElementUpdate(element.id, { size })}
            onContentChange={(content) => handleElementUpdate(element.id, { content })}
          />
        );
      default:
        return null;
    }
  };

  // Marquee box style
  const marqueeStyle = isMarqueeSelecting ? {
    left: Math.min(marqueeStart.x, marqueeEnd.x),
    top: Math.min(marqueeStart.y, marqueeEnd.y),
    width: Math.abs(marqueeEnd.x - marqueeStart.x),
    height: Math.abs(marqueeEnd.y - marqueeStart.y),
  } : null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - only show in standalone mode */}
      {!artifactId && (
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
              <h1 className="text-xl font-semibold">User Story Canvas</h1>
              <p className="text-sm text-muted-foreground">
                Create and organize user stories with drag-and-drop
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
              <Button onClick={() => navigate('/auth')} variant="outline">
                Sign In to Save
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b px-4 py-2 bg-card/50">
        <AIToolbar
          onAddElement={handleAddElement}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onExport={handleExport}
          zoom={zoom}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          saveStatus={saveStatus}
          selectedCount={selectedElementIds.length}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-auto bg-muted/30">
        <div
          ref={canvasRef}
          className="relative outline-none"
          style={{ 
            width: canvasBounds.width * zoom,
            height: canvasBounds.height * zoom,
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          }}
          tabIndex={0}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          <div 
            className="relative"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left',
              width: canvasBounds.width,
              height: canvasBounds.height,
            }}
          >
            {elements.map(renderElement)}
            
            {/* Marquee selection box */}
            {isMarqueeSelecting && marqueeStyle && (
              <div
                className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                style={marqueeStyle}
              />
            )}
            
            {/* Empty state */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center max-w-md">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Welcome to User Story Canvas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Add Story" to create user stories. Drag to move, double-click to edit.
                    Use marquee selection or Shift+click to select multiple elements.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="canvas"
        artifactName="User Story Canvas"
        artifactDescription={`Canvas with ${elements.length} elements`}
        artifactData={{ elements }}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={handleSaveComplete}
      />

      {/* Story Edit Dialog */}
      <UnifiedStoryEditDialog
        open={!!editingElement && editingElement.type === 'story'}
        onOpenChange={(open) => !open && setEditingElement(null)}
        data={editingElement ? canvasToUnifiedData(editingElement.content) : undefined}
        mode="story"
        title="Edit User Story"
        onSave={(newData) => {
          if (editingElement) {
            handleElementUpdate(editingElement.id, { content: unifiedToCanvasData(newData) });
            setEditingElement(null);
          }
        }}
      />

      {/* Split Story Dialog */}
      <SplitStoryDialog
        open={!!splittingElement}
        onOpenChange={(open) => !open && setSplittingElement(null)}
        canvasItem={splittingElement ? {
          id: splittingElement.id,
          title: splittingElement.content?.title || '',
          description: splittingElement.content?.story || splittingElement.content?.description || null,
          acceptance_criteria: splittingElement.content?.acceptanceCriteria || [],
          priority: splittingElement.content?.priority || 'medium',
          user_persona: splittingElement.content?.user_persona || null,
          tags: splittingElement.content?.tags || null,
          epic: splittingElement.content?.epic || null,
          source: splittingElement.content?.source || null,
        } : null}
        onSplit={(config) => {
          if (!splittingElement) return;
          
          const newElements: CanvasElement[] = [];
          const parentContent = splittingElement.content;
          const allCriteria = parentContent?.acceptanceCriteria || [];
          const parentPersona = parentContent?.user_persona || 'user';
          
          // Helper to format description as user story using child's title as "I want"
          const formatUserStoryDescription = (persona: string, childTitle: string): string => {
            // Use the child's title as the "I want" clause
            let want = childTitle.toLowerCase();
            
            // Make it grammatically correct
            if (want.match(/^(secure|valid|new|online|payment)/i)) {
              want = `a ${want}`;
            } else if (want.match(/displayed|shown|visible/i)) {
              want = `see ${want}`;
            }
            
            // Generate a contextual "so that" benefit based on keywords in the child title
            let benefit = 'I can complete my task successfully';
            
            if (childTitle.match(/secure|security|protect/i)) {
              benefit = 'I can pay safely online';
            } else if (childTitle.match(/option|select|choose|display/i)) {
              benefit = 'I can select the best option for me';
            } else if (childTitle.match(/valid|error|check/i)) {
              benefit = 'errors are caught before submission';
            } else if (childTitle.match(/confirm|receipt|success/i)) {
              benefit = 'I know my transaction was successful';
            } else if (childTitle.match(/card|payment/i)) {
              benefit = 'I can complete my purchase';
            } else if (childTitle.match(/form|field|input|enter/i)) {
              benefit = 'I can provide the required information';
            }
            
            return `As a ${persona}, I want ${want}, so that ${benefit}`;
          };
          
          config.childStories.forEach((child, index) => {
            if (!child.enabled) return;
            
            const criteriaText = allCriteria[child.criteriaIndex] || '';
            const persona = config.inheritPersona ? parentPersona : 'user';
            
            // Format description using child's title as "I want" and contextual benefit
            const description = config.formatAsUserStory 
              ? formatUserStoryDescription(persona, child.title)
              : criteriaText;
            
            const newElement: CanvasElement = {
              id: crypto.randomUUID(),
              type: 'story',
              position: {
                x: splittingElement.position.x + 320 + (index % 3) * 320,
                y: splittingElement.position.y + Math.floor(index / 3) * 200,
              },
              size: { width: 300, height: 180 },
              content: {
                title: child.title,
                story: description,
                description: description,
                acceptanceCriteria: [criteriaText],
                priority: config.inheritPriority ? parentContent?.priority : 'medium',
                storyPoints: 0,
                // Inherit additional fields
                user_persona: config.inheritPersona ? parentContent?.user_persona : undefined,
                tags: parentContent?.tags || undefined,
                epic: parentContent?.epic || undefined,
                source: parentContent?.source || 'Split from parent',
              },
            };
            newElements.push(newElement);
          });
          
          if (newElements.length > 0) {
            updateElementsWithHistory([...elements, ...newElements]);
            toast({
              title: 'Story Split',
              description: `Created ${newElements.length} new stories from acceptance criteria`,
            });
          }
          
          setSplittingElement(null);
        }}
        isLoading={false}
      />
    </div>
  );
};

export default AIToolsCanvas;
