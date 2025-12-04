import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Save } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { KnowledgeItemHexiElement } from './elements/KnowledgeItemHexiElement';
import { PlanningFocusHexiElement } from './elements/PlanningFocusHexiElement';
import { CustomHexiElement } from './elements/CustomHexiElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
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
  type: 'knowledge-item' | 'planning-focus' | 'custom-hexi' | 'sticky-note';
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
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [hasSyncedKB, setHasSyncedKB] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
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

  const handleAddKnowledgeItem = useCallback((itemId: string, itemData: any) => {
    const newElement: CanvasElement = {
      id: crypto.randomUUID(),
      type: 'knowledge-item',
      position: { x: 200 + elements.length * 20, y: 200 + elements.length * 20 },
      size: { width: 140, height: 121 },
      data: itemData,
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
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleElementDelete = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
    toast.success('Element deleted');
  }, [selectedElementId]);

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
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedElementId(null);
          }
        }}
      >
        <div
          ref={canvasRef}
          className="relative min-h-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
          }}
          onClick={(e) => {
            // Deselect when clicking on canvas background
            if (e.target === e.currentTarget) {
              setSelectedElementId(null);
            }
          }}
        >
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
            const isSelected = selectedElementId === element.id;
            
            switch (element.type) {
              case 'knowledge-item':
                return (
                  <KnowledgeItemHexiElement
                    key={element.id}
                    id={element.id}
                    knowledgeItemId={element.data.id || element.id}
                    position={element.position}
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
                    onSelect={() => setSelectedElementId(element.id)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
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
              } as any}
              isSelected={isSelected}
              onSelect={() => setSelectedElementId(element.id)}
              onUpdate={(updates) => {
                if (updates.position) {
                  handleElementUpdate(element.id, { position: updates.position });
                }
                if (updates.content) {
                  handleElementUpdate(element.id, { data: updates.content });
                }
              }}
              onDelete={() => handleElementDelete(element.id)}
            />
          );
              case 'custom-hexi':
                return (
                  <CustomHexiElement
                    key={element.id}
                    id={element.id}
                    position={element.position}
                    size={element.size}
                    data={element.data}
                    isSelected={isSelected}
                    onSelect={() => setSelectedElementId(element.id)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
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
                        // Use correct property names expected by KnowledgeItemHexiElement
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
                        // Find all custom-hexi elements with the same label and convert them all
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
                        // Convert only this element
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

                      // Auto-save to persist the type conversion
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
                    position={element.position}
                    size={element.size}
                    data={element.data}
                    isSelected={isSelected}
                    onSelect={() => setSelectedElementId(element.id)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
                    onResize={(newSize) => handleElementUpdate(element.id, { size: newSize })}
                    onContentChange={(newData) => handleElementUpdate(element.id, { data: newData })}
                    onDelete={() => handleElementDelete(element.id)}
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
