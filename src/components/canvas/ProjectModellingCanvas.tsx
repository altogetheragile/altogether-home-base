import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Save } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { KnowledgeItemHexiElement } from './elements/KnowledgeItemHexiElement';
import { PlanningFocusHexiElement } from './elements/PlanningFocusHexiElement';
import { CustomHexiElement } from './elements/CustomHexiElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
import { ArtifactLinkHexiElement } from './elements/ArtifactLinkHexiElement';
import { Toolbar } from './Toolbar';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { KBItemData } from './elements/SaveToKBDialog';
import { supabase } from '@/integrations/supabase/client';

interface CanvasElement {
  id: string;
  type: 'knowledge-item' | 'planning-focus' | 'custom-hexi' | 'sticky-note' | 'artifact-link';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
}

interface ProjectModellingCanvasProps {
  initialData?: { elements: CanvasElement[] };
  artifactId?: string;
  projectId?: string;
}

export const ProjectModellingCanvas: React.FC<ProjectModellingCanvasProps> = ({ 
  initialData, 
  artifactId, 
  projectId 
}) => {
  const [elements, setElements] = useState<CanvasElement[]>(initialData?.elements || []);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [hasSyncedKB, setHasSyncedKB] = useState(false);
  const [hasRefreshedKB, setHasRefreshedKB] = useState(false);
  
  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });
  
  // Group drag state for real-time movement
  const [isDraggingGroup, setIsDraggingGroup] = useState(false);
  const [groupDragDelta, setGroupDragDelta] = useState({ dx: 0, dy: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const wasMarqueeSelectingRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId');
  const { updateArtifact } = useProjectArtifactMutations();

  // Auto-sync custom hexis that match existing KB items on load
  useEffect(() => {
    const syncCustomHexisWithKB = async () => {
      if (!artifactId || !projectId || elements.length === 0 || hasSyncedKB) return;

      // Get all custom-hexi labels
      const customHexiLabels = elements
        .filter(e => e.type === 'custom-hexi')
        .map(e => e.data.label);

      if (customHexiLabels.length === 0) {
        setHasSyncedKB(true);
        return;
      }

      // Query KB for matching items
      const { data: matchingKBItems, error } = await supabase
        .from('knowledge_items')
        .select(`
          id, name, slug, icon, emoji,
          activity_domains (id, name, color),
          planning_focuses (id, name, color),
          knowledge_categories (id, name, color)
        `)
        .in('name', customHexiLabels);

      if (error || !matchingKBItems || matchingKBItems.length === 0) {
        setHasSyncedKB(true);
        return;
      }

      // Create a map of name -> KB item data
      const kbItemMap = new Map(matchingKBItems.map(item => [item.name, item]));

      // Convert matching custom-hexis to knowledge-items
      let hasChanges = false;
      const updatedElements = elements.map(el => {
        if (el.type === 'custom-hexi' && kbItemMap.has(el.data.label)) {
          const kbItem = kbItemMap.get(el.data.label)!;
          hasChanges = true;
          return {
            ...el,
            type: 'knowledge-item' as const,
            data: {
              id: kbItem.id,
              name: kbItem.name,
              slug: kbItem.slug,
              icon: kbItem.icon,
              emoji: kbItem.emoji,
              activity_domains: kbItem.activity_domains,
              planning_focuses: kbItem.planning_focuses,
              knowledge_categories: kbItem.knowledge_categories,
            },
          };
        }
        return el;
      });

      setHasSyncedKB(true);

      if (hasChanges) {
        setElements(updatedElements);
        // Auto-save the conversion
        try {
          await updateArtifact.mutateAsync({
            id: artifactId,
            updates: { data: { elements: updatedElements } }
          });
          toast.success('Synced canvas with Knowledge Base');
        } catch (error) {
          console.error('Auto-sync save failed:', error);
        }
      }
    };

    syncCustomHexisWithKB();
  }, [artifactId, projectId, elements.length, hasSyncedKB]);

  // Auto-refresh knowledge items with latest KB data on load
  useEffect(() => {
    const refreshKnowledgeItemData = async () => {
      if (!artifactId || !projectId || elements.length === 0 || hasRefreshedKB) return;

      // Get all knowledge-item elements
      const knowledgeItemElements = elements.filter(e => e.type === 'knowledge-item');
      
      if (knowledgeItemElements.length === 0) {
        setHasRefreshedKB(true);
        return;
      }

      // Separate elements with IDs vs those with only slugs (legacy elements)
      const elementsWithId = knowledgeItemElements.filter(e => e.data.id);
      const elementsWithSlugOnly = knowledgeItemElements.filter(e => !e.data.id && e.data.slug);

      const itemIds = elementsWithId.map(e => e.data.id);
      const slugs = elementsWithSlugOnly.map(e => e.data.slug);

      // Fetch items by ID
      let latestItems: any[] = [];
      if (itemIds.length > 0) {
        const { data, error } = await supabase
          .from('knowledge_items')
          .select(`
            id, name, slug, icon, emoji,
            activity_domains (id, name, color),
            planning_focuses (id, name, color),
            knowledge_categories (id, name, color)
          `)
          .in('id', itemIds);
        if (!error && data) latestItems = [...latestItems, ...data];
      }

      // Fetch items by slug for legacy elements missing IDs
      if (slugs.length > 0) {
        const { data, error } = await supabase
          .from('knowledge_items')
          .select(`
            id, name, slug, icon, emoji,
            activity_domains (id, name, color),
            planning_focuses (id, name, color),
            knowledge_categories (id, name, color)
          `)
          .in('slug', slugs);
        if (!error && data) latestItems = [...latestItems, ...data];
      }

      if (latestItems.length === 0) {
        setHasRefreshedKB(true);
        return;
      }

      // Create maps for quick lookup
      const latestItemByIdMap = new Map(latestItems.map(item => [item.id, item]));
      const latestItemBySlugMap = new Map(latestItems.map(item => [item.slug, item]));

      // Update elements with latest KB data and add missing IDs
      let hasChanges = false;
      const updatedElements = elements.map(el => {
        if (el.type !== 'knowledge-item') return el;

        // Find the matching KB item by id or slug
        let latest = el.data.id ? latestItemByIdMap.get(el.data.id) : null;
        if (!latest && el.data.slug) {
          latest = latestItemBySlugMap.get(el.data.slug);
        }

        if (!latest) return el;
          
        // Handle both array and object returns from Supabase join
        const latestCategory = Array.isArray(latest.knowledge_categories) 
          ? latest.knowledge_categories[0] 
          : latest.knowledge_categories;
        const latestDomain = Array.isArray(latest.activity_domains) 
          ? latest.activity_domains[0] 
          : latest.activity_domains;
        const latestFocus = Array.isArray(latest.planning_focuses) 
          ? latest.planning_focuses[0] 
          : latest.planning_focuses;
        
        // Check if we need to update (missing id, or category/domain/focus data differs)
        const needsIdUpdate = !el.data.id && latest.id;
        const needsDataUpdate = 
          el.data.knowledge_categories?.id !== latestCategory?.id ||
          el.data.activity_domains?.id !== latestDomain?.id ||
          el.data.planning_focuses?.id !== latestFocus?.id;
        
        if (needsIdUpdate || needsDataUpdate) {
          hasChanges = true;
          return {
            ...el,
            data: {
              ...el.data,
              id: latest.id, // Ensure the KB id is stored
              knowledge_categories: latestCategory,
              activity_domains: latestDomain,
              planning_focuses: latestFocus,
            }
          };
        }
        return el;
      });

      setHasRefreshedKB(true);

      if (hasChanges) {
        setElements(updatedElements);
        // Auto-save the refresh
        try {
          await updateArtifact.mutateAsync({
            id: artifactId,
            updates: { data: { elements: updatedElements } }
          });
          toast.success('Canvas synced with Knowledge Base');
        } catch (error) {
          console.error('KB refresh save failed:', error);
        }
      }
    };

    refreshKnowledgeItemData();
  }, [artifactId, projectId, elements.length, hasRefreshedKB]);

  const handleAddKnowledgeItem = useCallback((itemId: string, itemData: any) => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'knowledge-item',
      position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
      size: { width: 140, height: 121 },
      data: {
        ...itemData,
        id: itemId, // Store the actual knowledge item database ID for edit links
      },
    };
    setElements([...elements, newElement]);
    toast.success(`Added ${itemData.name || 'Knowledge Item'}`);
  }, [elements]);

  const handleAddPlanningFocus = useCallback((focusId: string, focusData: any) => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'planning-focus',
      position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
      size: { width: 140, height: 121 },
      data: focusData,
    };
    setElements([...elements, newElement]);
    toast.success(`Added ${focusData.name || 'Planning Focus'}`);
  }, [elements]);

  const handleAddCustomHexi = useCallback(() => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'custom-hexi',
      position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
      size: { width: 140, height: 121 },
      data: { label: 'New Hexi', color: '#4F46E5', icon: 'Lightbulb' },
    };
    setElements([...elements, newElement]);
    toast.success('Added Custom Hexi');
  }, [elements]);

  const handleAddArtifactLink = useCallback(() => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'artifact-link',
      position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
      size: { width: 140, height: 121 },
      data: { 
        linkType: 'placeholder',
        label: 'Link...', 
        color: '#9CA3AF',
      },
    };
    setElements([...elements, newElement]);
    toast.success('Added Artifact Link');
  }, [elements]);

  const handleAddElement = useCallback((type: string) => {
    if (type === 'sticky') {
      const newElement: CanvasElement = {
        id: crypto.randomUUID(),
        type: 'sticky-note',
        position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
        size: { width: 200, height: 200 },
        data: { text: 'New note', color: '#FFE066' },
      };
      setElements([...elements, newElement]);
      toast.success('Added Sticky Note');
    }
  }, [elements]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        let newUpdates = { ...updates };
        // Clamp position to prevent off-screen movement
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
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElementIds(prev => prev.filter(eid => eid !== id));
    toast.success('Element deleted');
  }, []);

  // Handle selecting an element (with Shift for multi-select, preserveIfSelected for drag start)
  const handleElementSelect = useCallback((id: string, shiftKey: boolean = false, preserveIfSelected: boolean = false) => {
    if (shiftKey) {
      // Shift-click: toggle element in selection
      setSelectedElementIds(prev => 
        prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
      );
    } else if (preserveIfSelected) {
      // Drag start: preserve selection if clicking already-selected element
      setSelectedElementIds(prev => 
        prev.includes(id) ? prev : [id]
      );
    } else {
      // Normal click: single select
      setSelectedElementIds([id]);
    }
  }, []);

  // Handle group drag start (for real-time movement visualization)
  const handleGroupDragStart = useCallback(() => {
    if (selectedElementIds.length > 1) {
      setIsDraggingGroup(true);
      setGroupDragDelta({ dx: 0, dy: 0 });
    }
  }, [selectedElementIds.length]);

  // Handle group drag progress (real-time visual update with boundary clamping)
  const handleGroupDragProgress = useCallback((delta: { dx: number; dy: number }) => {
    if (selectedElementIds.length > 1) {
      // Find minimum positions to prevent visual dragging past bounds
      let minX = Infinity;
      let minY = Infinity;
      elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
          minX = Math.min(minX, el.position.x);
          minY = Math.min(minY, el.position.y);
        }
      });
      
      // Clamp delta during drag preview
      const clampedDelta = {
        dx: Math.max(delta.dx, -minX),
        dy: Math.max(delta.dy, -minY),
      };
      setGroupDragDelta(clampedDelta);
    }
  }, [selectedElementIds, elements]);

  // Handle group movement when dragging a selected element ends
  const handleGroupMove = useCallback((draggedId: string, delta: { dx: number; dy: number }) => {
    setIsDraggingGroup(false);
    setGroupDragDelta({ dx: 0, dy: 0 });
    
    // Find minimum positions to determine max allowed negative delta
    let minX = Infinity;
    let minY = Infinity;
    elements.forEach(el => {
      if (selectedElementIds.includes(el.id)) {
        minX = Math.min(minX, el.position.x);
        minY = Math.min(minY, el.position.y);
      }
    });
    
    // Clamp delta so no element goes below 0
    const clampedDelta = {
      dx: Math.max(delta.dx, -minX),
      dy: Math.max(delta.dy, -minY),
    };
    
    setElements(prev => prev.map(el => {
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
    }));
  }, [selectedElementIds, elements]);

  // Calculate visual position (applies group drag delta during drag)
  const getVisualPosition = useCallback((element: CanvasElement) => {
    if (isDraggingGroup && selectedElementIds.includes(element.id)) {
      return {
        x: element.position.x + groupDragDelta.dx,
        y: element.position.y + groupDragDelta.dy,
      };
    }
    return element.position;
  }, [isDraggingGroup, groupDragDelta, selectedElementIds]);

  // Helper to check if element is in selection box
  const isElementInSelectionBox = useCallback((element: CanvasElement, box: { left: number; top: number; right: number; bottom: number }) => {
    const { x, y } = element.position;
    const { width, height } = element.size;
    return (
      x < box.right && x + width > box.left &&
      y < box.bottom && y + height > box.top
    );
  }, []);

  // Marquee selection handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start marquee if clicking directly on canvas background
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    
    // Focus canvas for keyboard events
    canvasRef.current?.focus({ preventScroll: true });
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setIsMarqueeSelecting(true);
    setMarqueeStart({ x, y });
    setMarqueeEnd({ x, y });
    
    // Clear selection unless shift is held
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
    
    // Mark that we just finished marquee selecting to prevent onClick from clearing selection
    wasMarqueeSelectingRef.current = true;
    setTimeout(() => { wasMarqueeSelectingRef.current = false; }, 0);
    
    const box = {
      left: Math.min(marqueeStart.x, marqueeEnd.x),
      top: Math.min(marqueeStart.y, marqueeEnd.y),
      right: Math.max(marqueeStart.x, marqueeEnd.x),
      bottom: Math.max(marqueeStart.y, marqueeEnd.y),
    };
    
    // Only select if marquee has some size (avoid click-only selecting nothing)
    const marqueeWidth = box.right - box.left;
    const marqueeHeight = box.bottom - box.top;
    
    if (marqueeWidth > 5 || marqueeHeight > 5) {
      const newSelected = elements
        .filter(el => isElementInSelectionBox(el, box))
        .map(el => el.id);
      
      if (e.shiftKey) {
        setSelectedElementIds(prev => [...new Set([...prev, ...newSelected])]);
      } else {
        setSelectedElementIds(newSelected);
      }
    }
    
    setIsMarqueeSelecting(false);
  }, [isMarqueeSelecting, marqueeStart, marqueeEnd, elements, isElementInSelectionBox]);

  // Keyboard shortcut for select all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Canvas keydown:', e.key, 'Cmd/Ctrl:', e.metaKey || e.ctrlKey);
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        console.log('Select all triggered, elements:', elements.length);
        setSelectedElementIds(elements.map(el => el.id));
      }
      if (e.key === 'Escape') {
        setSelectedElementIds([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements]);

  const handleDuplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const newElement: CanvasElement = {
      ...element,
      id: crypto.randomUUID(),
      position: { 
        x: element.position.x + 30, 
        y: element.position.y + 30 
      },
    };
    setElements(prev => [...prev, newElement]);
    toast.success('Element duplicated');
  }, [elements]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    try {
      toast.info('Generating export...');
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('project-model.pdf');
      toast.success('Export completed!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export canvas');
    }
  };

  const handleSaveToProject = () => {
    setSaveDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!artifactId || !projectId) return;
    
    try {
      await updateArtifact.mutateAsync({
        id: artifactId,
        updates: { data: { elements } }
      });
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    }
  };


  const existingItemIds = elements
    .filter(el => el.type === 'knowledge-item')
    .map(el => el.data.id)
    .filter(Boolean);

  // Calculate dynamic canvas bounds based on element positions
  const canvasBounds = useMemo(() => {
    const MIN_WIDTH = 2000;
    const MIN_HEIGHT = 1500;
    const PADDING = 500;

    if (elements.length === 0) {
      return { width: MIN_WIDTH, height: MIN_HEIGHT };
    }

    let maxX = 0;
    let maxY = 0;

    elements.forEach(el => {
      const rightEdge = el.position.x + el.size.width;
      const bottomEdge = el.position.y + el.size.height;
      maxX = Math.max(maxX, rightEdge);
      maxY = Math.max(maxY, bottomEdge);
    });

    return {
      width: Math.max(MIN_WIDTH, maxX + PADDING),
      height: Math.max(MIN_HEIGHT, maxY + PADDING)
    };
  }, [elements]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - only show in standalone mode */}
      {!artifactId && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                  <h1 className="text-2xl font-bold">Project Modelling Canvas</h1>
                  <p className="text-sm text-muted-foreground">
                    Brainstorm and model your project using techniques and frameworks
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveToProject}>
                  Save to Project
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-2">
          <Toolbar
            onAddElement={handleAddElement}
            onAddKnowledgeItem={handleAddKnowledgeItem}
            onAddPlanningFocus={handleAddPlanningFocus}
            onAddCustomHexi={handleAddCustomHexi}
            onAddArtifactLink={handleAddArtifactLink}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onExport={handleExport}
            zoom={zoom}
            existingKnowledgeItemIds={existingItemIds}
            artifactId={artifactId}
            onSaveChanges={handleSaveChanges}
          />
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        className="flex-1 overflow-auto bg-muted/30"
      >
        <div
          ref={canvasRef}
          className="relative outline-none"
          tabIndex={0}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: canvasBounds.width + 48,
            height: canvasBounds.height + 48,
            minWidth: '100%',
            minHeight: '100%',
            padding: '24px',
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => setIsMarqueeSelecting(false)}
          onClick={(e) => {
            // Deselect when clicking on canvas background (but not after marquee selection)
            if (e.target === e.currentTarget && !isMarqueeSelecting && !wasMarqueeSelectingRef.current) {
              setSelectedElementIds([]);
              canvasRef.current?.focus({ preventScroll: true });
            }
          }}
        >
          {/* Marquee selection box */}
          {isMarqueeSelecting && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-[2000]"
              style={{
                left: Math.min(marqueeStart.x, marqueeEnd.x),
                top: Math.min(marqueeStart.y, marqueeEnd.y),
                width: Math.abs(marqueeEnd.x - marqueeStart.x),
                height: Math.abs(marqueeEnd.y - marqueeStart.y),
              }}
            />
          )}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground max-w-md">
                <h3 className="text-lg font-semibold mb-2">Start Building Your Project Model</h3>
                <p className="text-sm">
                  Use the toolbar above to add Knowledge Items, Planning Focuses, Custom Hexis, or Sticky Notes to your canvas.
                </p>
              </div>
            </div>
          )}
          
          {elements.map((element) => {
            const isSelected = selectedElementIds.includes(element.id);
            const isMultiSelected = selectedElementIds.length > 1 && isSelected;
            
            switch (element.type) {
              case 'knowledge-item':
                return (
                  <KnowledgeItemHexiElement
                    key={element.id}
                    id={element.id}
                    knowledgeItemId={element.data.id || element.id}
                    position={getVisualPosition(element)}
                    size={element.size}
                    data={{
                      name: element.data.name || 'Unknown',
                      slug: element.data.slug || '',
                      domain_color: element.data.activity_domains?.color,
                      domain_name: element.data.activity_domains?.name,
                      planning_focus_color: element.data.planning_focuses?.color,
                      planning_focus_name: element.data.planning_focuses?.name,
                      category_color: element.data.knowledge_categories?.color,
                      category_name: element.data.knowledge_categories?.name,
                      icon: element.data.icon,
                      emoji: element.data.emoji,
                    }}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    isMarqueeSelecting={isMarqueeSelecting}
                    onSelect={(e, preserveIfSelected) => handleElementSelect(element.id, e?.shiftKey ?? false, preserveIfSelected)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
                    onMoveGroup={(delta) => handleGroupMove(element.id, delta)}
                    onGroupDragStart={handleGroupDragStart}
                    onGroupDragProgress={handleGroupDragProgress}
                    onDelete={() => handleElementDelete(element.id)}
                    onDuplicate={() => handleDuplicateElement(element.id)}
                    artifactId={artifactId}
                    projectId={projectId}
                  />
                );
        case 'planning-focus':
          return (
            <PlanningFocusHexiElement
              key={element.id}
              element={{
                ...element,
                type: 'planningFocus' as const,
                content: element.data,
                position: getVisualPosition(element),
              } as any}
              isSelected={isSelected}
              isMultiSelected={isMultiSelected}
              isMarqueeSelecting={isMarqueeSelecting}
              onSelect={(e, preserveIfSelected) => handleElementSelect(element.id, e?.shiftKey ?? false, preserveIfSelected)}
              onUpdate={(updates) => {
                if (updates.position) {
                  handleElementUpdate(element.id, { position: updates.position });
                }
                if (updates.content) {
                  handleElementUpdate(element.id, { data: updates.content });
                }
              }}
              onMoveGroup={(delta) => handleGroupMove(element.id, delta)}
              onGroupDragStart={handleGroupDragStart}
              onGroupDragProgress={handleGroupDragProgress}
              onDelete={() => handleElementDelete(element.id)}
            />
          );
              case 'custom-hexi':
                return (
                  <CustomHexiElement
                    key={element.id}
                    id={element.id}
                    position={getVisualPosition(element)}
                    size={element.size}
                    data={element.data}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    isMarqueeSelecting={isMarqueeSelecting}
                    onSelect={(e, preserveIfSelected) => handleElementSelect(element.id, e?.shiftKey ?? false, preserveIfSelected)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
                    onMoveGroup={(delta) => handleGroupMove(element.id, delta)}
                    onGroupDragStart={handleGroupDragStart}
                    onGroupDragProgress={handleGroupDragProgress}
                    onContentChange={(newData) => handleElementUpdate(element.id, { data: newData })}
                    onDelete={() => handleElementDelete(element.id)}
                    onDuplicate={() => handleDuplicateElement(element.id)}
                  onSaveToKB={(knowledgeItemId: string, convertToKB: boolean, convertAllMatching: boolean, itemData: KBItemData) => {
                    const el = element;
                    if (convertToKB && knowledgeItemId && itemData) {
                      const newKBData = {
                        id: knowledgeItemId,
                        name: itemData.name,
                        slug: itemData.slug,
                        icon: itemData.icon,
                        emoji: itemData.emoji,
                        activity_domains: itemData.activity_domain ? {
                          color: itemData.activity_domain.color,
                          name: itemData.activity_domain.name,
                        } : undefined,
                        planning_focuses: itemData.planning_focus ? {
                          color: itemData.planning_focus.color,
                          name: itemData.planning_focus.name,
                        } : undefined,
                        knowledge_categories: itemData.category ? {
                          color: itemData.category.color,
                          name: itemData.category.name,
                        } : undefined,
                      };

                      let updatedElements: CanvasElement[];

                      if (convertAllMatching) {
                        const matchingLabel = el.data.label;
                        
                        updatedElements = elements.map(e => {
                          if (e.type === 'custom-hexi' && e.data.label === matchingLabel) {
                            return {
                              ...e,
                              type: 'knowledge-item' as const,
                              data: newKBData,
                            };
                          }
                          return e;
                        });
                        
                        setElements(updatedElements);
                        toast.success(`Saved "${itemData.name}" and converted all matching hexis!`);
                      } else {
                        updatedElements = elements.map(e => {
                          if (e.id === el.id) {
                            return {
                              ...e,
                              type: 'knowledge-item' as const,
                              data: newKBData,
                            };
                          }
                          return e;
                        });
                        
                        setElements(updatedElements);
                        toast.success(`"${itemData.name}" saved and converted to KB item!`);
                      }

                      if (artifactId && projectId) {
                        updateArtifact.mutateAsync({
                          id: artifactId,
                          updates: { data: { elements: updatedElements } }
                        }).catch(error => {
                          console.error('Auto-save failed:', error);
                          toast.error('Failed to auto-save conversion');
                        });
                      }
                    } else {
                      toast.success(`"${el.data.label}" saved to Knowledge Base!`);
                    }
                  }}
                  />
                );
              case 'sticky-note':
                return (
                  <StickyNoteElement
                    key={element.id}
                    id={element.id}
                    position={getVisualPosition(element)}
                    size={element.size}
                    data={element.data}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    isMarqueeSelecting={isMarqueeSelecting}
                    onSelect={(e, preserveIfSelected) => handleElementSelect(element.id, e?.shiftKey ?? false, preserveIfSelected)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
                    onMoveGroup={(delta) => handleGroupMove(element.id, delta)}
                    onGroupDragStart={handleGroupDragStart}
                    onGroupDragProgress={handleGroupDragProgress}
                    onResize={(newSize) => handleElementUpdate(element.id, { size: newSize })}
                    onContentChange={(newData) => handleElementUpdate(element.id, { data: newData })}
                    onDelete={() => handleElementDelete(element.id)}
                  />
                );
              case 'artifact-link':
                return (
                  <ArtifactLinkHexiElement
                    key={element.id}
                    id={element.id}
                    position={getVisualPosition(element)}
                    size={element.size}
                    data={element.data}
                    isSelected={isSelected}
                    isMultiSelected={isMultiSelected}
                    isMarqueeSelecting={isMarqueeSelecting}
                    projectId={projectId}
                    onSelect={(e, preserveIfSelected) => handleElementSelect(element.id, e?.shiftKey ?? false, preserveIfSelected)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
                    onMoveGroup={(delta) => handleGroupMove(element.id, delta)}
                    onGroupDragStart={handleGroupDragStart}
                    onGroupDragProgress={handleGroupDragProgress}
                    onContentChange={(newData) => handleElementUpdate(element.id, { data: newData })}
                    onDelete={() => handleElementDelete(element.id)}
                    onDuplicate={() => handleDuplicateElement(element.id)}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      </div>

      {/* Save Dialog */}
      <SaveToProjectDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        artifactType="project-model"
        artifactName="Project Model"
        artifactDescription="Visual project model with techniques and planning elements"
        artifactData={{ elements }}
        preselectedProjectId={preselectedProjectId || undefined}
        onSaveComplete={() => {
          toast.success('Project model saved successfully');
          setSaveDialogOpen(false);
        }}
      />
    </div>
  );
};
