import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ArrowUpRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import LogoFull from '@/components/LogoFull';
import { Separator } from '@/components/ui/separator';
import { KnowledgeItemHexiElement } from './elements/KnowledgeItemHexiElement';
import { PlanningFocusHexiElement } from './elements/PlanningFocusHexiElement';
import { CustomHexiElement } from './elements/CustomHexiElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
import { ArtifactLinkHexiElement } from './elements/ArtifactLinkHexiElement';
import { Toolbar, SaveStatus } from './Toolbar';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';
import { toast } from 'sonner';
const loadHtml2Canvas = () => import('html2canvas').then(m => m.default);
const loadJsPDF = () => import('jspdf').then(m => m.default);
import type { KBItemData } from './elements/SaveToKBDialog';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedCallback } from 'use-debounce';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useCanvasInteraction } from '@/hooks/canvas/useCanvasInteraction';

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
  const { items: elements, setItems: setElements, updateWithHistory: updateElementsWithHistory, undo, redo, canUndo, canRedo } = useCanvasHistory<CanvasElement>(initialData?.elements || []);

  // Shared canvas interaction: selection, zoom, marquee, group drag, shortcuts, bounds
  const {
    selectedElementIds, setSelectedElementIds,
    zoom, handleZoomIn, handleZoomOut,
    isMarqueeSelecting, setIsMarqueeSelecting, marqueeStart, marqueeEnd,
    canvasRef, wasMarqueeSelectingRef,
    handleGroupDragStart, handleGroupDragProgress, handleGroupMove,
    getVisualPosition,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
    canvasBounds,
  } = useCanvasInteraction<CanvasElement>({
    elements,
    updateElementsWithHistory,
    undo,
    redo,
    isBackgroundClick: (e) => e.target === e.currentTarget,
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [hasSyncedKB, setHasSyncedKB] = useState(false);
  const [hasRefreshedKB, setHasRefreshedKB] = useState(false);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
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
    updateElementsWithHistory([...elements, newElement]);
    toast.success(`Added ${itemData.name || 'Knowledge Item'}`);
  }, [elements, updateElementsWithHistory]);

  const handleAddPlanningFocus = useCallback((_focusId: string, focusData: Record<string, unknown>) => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'planning-focus',
      position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
      size: { width: 140, height: 121 },
      data: focusData,
    };
    updateElementsWithHistory([...elements, newElement]);
    toast.success(`Added ${focusData.name || 'Planning Focus'}`);
  }, [elements, updateElementsWithHistory]);

  const handleAddCustomHexi = useCallback(() => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'custom-hexi',
      position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
      size: { width: 140, height: 121 },
      data: { label: 'New Hexi', color: '#4F46E5', icon: 'Lightbulb' },
    };
    updateElementsWithHistory([...elements, newElement]);
    toast.success('Added Custom Hexi');
  }, [elements, updateElementsWithHistory]);

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
    updateElementsWithHistory([...elements, newElement]);
    toast.success('Added Artifact Link');
  }, [elements, updateElementsWithHistory]);

  const handleAddElement = useCallback((type: string) => {
    if (type === 'sticky') {
      const newElement: CanvasElement = {
        id: crypto.randomUUID(),
        type: 'sticky-note',
        position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
        size: { width: 200, height: 200 },
        data: { text: 'New note', color: '#FFE066' },
      };
      updateElementsWithHistory([...elements, newElement]);
      toast.success('Added Sticky Note');
    }
  }, [elements, updateElementsWithHistory]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const newUpdates = { ...updates };
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
    updateElementsWithHistory(elements.filter(el => el.id !== id));
    setSelectedElementIds(prev => prev.filter(eid => eid !== id));
    toast.success('Element deleted');
  }, [elements, updateElementsWithHistory]);

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
    updateElementsWithHistory([...elements, newElement]);
    toast.success('Element duplicated');
  }, [elements, updateElementsWithHistory]);


  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    try {
      toast.info('Generating export...');
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const jsPDF = await loadJsPDF();
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('project-model.pdf');
      toast.success('Export completed!');
    } catch (error) {
      toast.error('Failed to export canvas');
    }
  };

  const handleSaveToProject = () => {
    setSaveDialogOpen(true);
  };

  // Auto-save with debounce
  const performAutoSave = useDebouncedCallback(async (elementsToSave: CanvasElement[]) => {
    if (!artifactId || !projectId) return;
    
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

  // Trigger auto-save on element changes
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    
    if (artifactId && projectId) {
      performAutoSave(elements);
    }
  }, [elements, artifactId, projectId]);

  // Flush pending auto-save on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      performAutoSave.flush();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      performAutoSave.flush();
    };
  }, [performAutoSave]);

  const handleSaveChanges = async () => {
    if (!artifactId || !projectId) return;
    
    performAutoSave.cancel();
    setSaveStatus('saving');
    try {
      await updateArtifact.mutateAsync({
        id: artifactId,
        updates: { data: { elements } }
      });
      setSaveStatus('saved');
      toast.success('Changes saved successfully');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      toast.error('Failed to save changes');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };


  const existingItemIds = elements
    .filter(el => el.type === 'knowledge-item')
    .map(el => el.data.id)
    .filter(Boolean);

  // Promote-to (spec 6.5): a selected sticky or hexi can flow into the pipeline.
  const targetProjectId = projectId || preselectedProjectId || undefined;
  const selectedSingle = selectedElementIds.length === 1
    ? elements.find((e) => e.id === selectedElementIds[0])
    : undefined;
  const promotable = !!selectedSingle && selectedSingle.type !== 'artifact-link';
  const promoteText = (el?: CanvasElement): string =>
    String(el?.data?.label ?? el?.data?.text ?? el?.data?.title ?? '').trim();

  const promoteToBacklog = useCallback(async () => {
    const el = selectedSingle;
    const text = promoteText(el);
    if (!el || !text) { toast.error('Add some text to this element first.'); return; }
    if (!targetProjectId) { toast.info('Save this canvas to a project first, then you can promote elements.'); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: maxPos } = await supabase
        .from('backlog_items')
        .select('backlog_position')
        .eq('project_id', targetProjectId)
        .order('backlog_position', { ascending: false })
        .limit(1);
      const position = (maxPos?.[0]?.backlog_position ?? -1) + 1;
      const { data: item, error } = await supabase
        .from('backlog_items')
        .insert({
          project_id: targetProjectId,
          title: text.length > 120 ? `${text.slice(0, 117)}...` : text,
          description: text,
          source: 'From Modelling Canvas',
          status: 'idea',
          backlog_position: position,
          created_by: user?.id ?? null,
        } as any)
        .select('id')
        .single();
      if (error) throw error;
      await supabase.from('project_artifact_links').insert({
        project_id: targetProjectId,
        from_type: 'project-model',
        from_id: `${artifactId || 'project-modelling'}#element:${el.id}`,
        to_type: 'backlog_item',
        to_id: item.id,
        link_kind: 'derived_from',
        created_by: user?.id ?? null,
      } as any);
      toast.success('Promoted to the backlog');
    } catch (e) {
      toast.error('Could not promote: ' + (e instanceof Error ? e.message : 'please try again'));
    }
  }, [selectedSingle, targetProjectId, artifactId]);

  const promoteToNewArtifact = useCallback(() => {
    // Opens the Canvas Picker so the element can seed a new artifact of a chosen type.
    const url = targetProjectId ? `/canvases?projectId=${targetProjectId}` : '/canvases';
    window.open(url, '_blank');
  }, [targetProjectId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - only show in standalone mode */}
      {!artifactId && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/" aria-label="Altogether Agile home" className="flex-shrink-0">
                  <LogoFull height={32} />
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
        <div className="px-4 py-2">
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
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            saveStatus={saveStatus}
          />
        </div>
      </div>

      {/* Promote-to bar: appears when a single sticky or hexi is selected (6.5) */}
      {promotable && (
        <div className="border-b bg-accent/30">
          <div className="flex items-center gap-2 px-4 py-1.5">
            <span className="text-xs text-muted-foreground">
              Selected: <strong>{promoteText(selectedSingle).slice(0, 48) || 'element'}</strong>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-7">
                  <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> Promote to...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={promoteToBacklog}>Backlog item (story)</DropdownMenuItem>
                <DropdownMenuItem onClick={promoteToNewArtifact}>New artifact (choose a canvas)...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!targetProjectId && (
              <span className="text-xs text-muted-foreground">Save to a project to enable.</span>
            )}
          </div>
        </div>
      )}

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
                      // Pass linked resource data
                      linkedArtifactId: element.data.linkedArtifactId,
                      linkedArtifactType: element.data.linkedArtifactType,
                      linkedArtifactName: element.data.linkedArtifactName,
                      linkedFileUrl: element.data.linkedFileUrl,
                      linkedFileName: element.data.linkedFileName,
                      linkedExternalUrl: element.data.linkedExternalUrl,
                      linkLabel: element.data.linkLabel,
                      linkType: element.data.linkType,
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
                    onUpdateData={(newData) => handleElementUpdate(element.id, { data: { ...element.data, ...newData } })}
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
                        }).catch(() => {
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
