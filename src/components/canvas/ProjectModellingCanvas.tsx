import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KnowledgeItemHexiElement } from './elements/KnowledgeItemHexiElement';
import { PlanningFocusHexiElement } from './elements/PlanningFocusHexiElement';
import { CustomHexiElement } from './elements/CustomHexiElement';
import { StickyNoteElement } from './elements/StickyNoteElement';
import { Toolbar } from './Toolbar';
import { SaveToProjectDialog } from '@/components/projects/SaveToProjectDialog';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CanvasElement {
  id: string;
  type: 'knowledge-item' | 'planning-focus' | 'custom-hexi' | 'sticky-note';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
}

interface ProjectModellingCanvasProps {
  initialData?: { elements: CanvasElement[] };
}

export const ProjectModellingCanvas: React.FC<ProjectModellingCanvasProps> = ({ initialData }) => {
  const [elements, setElements] = useState<CanvasElement[]>(initialData?.elements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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


  const existingItemIds = elements
    .filter(el => el.type === 'knowledge-item')
    .map(el => el.data.id)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/ai-tools')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to AI Tools
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
          />
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div
          ref={canvasRef}
          className="relative min-h-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
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
                      domain_color: element.data.activity_domain?.color,
                      domain_name: element.data.activity_domain?.name,
                      planning_focus_color: element.data.planning_focus?.color,
                      planning_focus_name: element.data.planning_focus?.name,
                      category_color: element.data.category?.color,
                      category_name: element.data.category?.name,
                      icon: element.data.icon,
                      emoji: element.data.emoji,
                    }}
                    isSelected={isSelected}
                    onSelect={() => setSelectedElementId(element.id)}
                    onMove={(newPos) => handleElementUpdate(element.id, { position: newPos })}
                    onDelete={() => handleElementDelete(element.id)}
                  />
                );
              case 'planning-focus':
                return (
                  <PlanningFocusHexiElement
                    key={element.id}
                    element={element.data}
                    isSelected={isSelected}
                    onSelect={() => setSelectedElementId(element.id)}
                    onUpdate={(newData) => handleElementUpdate(element.id, { data: newData })}
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
        onSaveComplete={() => {
          toast.success('Project model saved successfully');
          setSaveDialogOpen(false);
        }}
      />
    </div>
  );
};
