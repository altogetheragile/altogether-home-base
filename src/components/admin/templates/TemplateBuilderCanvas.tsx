import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TemplateFieldToolbar } from './TemplateFieldToolbar';
import { TemplatePreview } from './TemplatePreview';
import { TemplateSectionEditor } from './TemplateSectionEditor';
import { DebouncedTemplateInput } from './DebouncedTemplateInput';
import { TemplateDesignLayout } from './TemplateDesignLayout';
import { TemplateGrid } from './TemplateGrid';
import { ImprovedPropertiesPanel } from './ImprovedPropertiesPanel';
import { InlineTextEditor } from './InlineTextEditor';
import type { KnowledgeTemplate, TemplateConfig, TemplateField, TemplateSection, TemplateType } from '@/types/template';
import { BottomToolbar } from './BottomToolbar';
import { CollapsedSidebar } from './CollapsedSidebar';
import { RichTextFieldEditor } from './RichTextFieldEditor';
import { useTemplateAlignment } from '@/hooks/useTemplateAlignment';
import { useMultiSelection } from '@/hooks/useMultiSelection';
import { Save, Eye, Undo, Redo, Layout, ZoomIn, ZoomOut, RotateCcw, Move3D } from 'lucide-react';

interface TemplateBuilderCanvasProps {
  template?: KnowledgeTemplate;
  onSave: (template: Partial<KnowledgeTemplate>) => void;
  onPreview: (config: TemplateConfig) => void;
  isSaving?: boolean;
}

export const TemplateBuilderCanvas: React.FC<TemplateBuilderCanvasProps> = ({
  template,
  onSave,
  onPreview,
  isSaving = false
}) => {
  const [config, setConfig] = useState<TemplateConfig>(
    template?.config || {
      layout: 'canvas',
      dimensions: { width: 1200, height: 800 },
      sections: [],
      styling: {
        backgroundColor: 'hsl(var(--background))',
        fontFamily: 'inherit',
        primaryColor: 'hsl(var(--primary))',
        secondaryColor: 'hsl(var(--accent))'
      }
    }
  );

  // Template metadata state
  const [templateTitle, setTemplateTitle] = useState(template?.title || '');
  const [templateType, setTemplateType] = useState<TemplateType>(template?.template_type || 'canvas');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');

  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [selectedSection, setSelectedSection] = useState<TemplateSection | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'preview'>('design');
  const [history, setHistory] = useState<TemplateConfig[]>([config]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [showSectionTitles, setShowSectionTitles] = useState(true);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Multi-selection and alignment hooks
  const multiSelection = useMultiSelection();
  const alignment = useTemplateAlignment();

  const canvasRef = useRef<HTMLDivElement>(null);

  const updateConfig = useCallback((newConfig: TemplateConfig) => {
    setConfig(newConfig);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newConfig);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setConfig(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setConfig(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const addSection = useCallback(() => {
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      backgroundColor: 'hsl(var(--card))',
      borderColor: 'hsl(var(--border))',
      fields: []
    };

    updateConfig({
      ...config,
      sections: [...config.sections, newSection]
    });
  }, [config, updateConfig]);

  const addField = useCallback((sectionId: string, field: Omit<TemplateField, 'id'>) => {
    const newField: TemplateField = {
      ...field,
      id: `field-${Date.now()}`,
      x: 10,
      y: 10,
      width: 200,
      height: field.type === 'textarea' ? 80 : 40
    };

    const updatedSections = config.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: [...section.fields, newField]
        };
      }
      return section;
    });

    updateConfig({
      ...config,
      sections: updatedSections
    });
  }, [config, updateConfig]);

  const updateSection = useCallback((sectionId: string, updates: Partial<TemplateSection>) => {
    const updatedSections = config.sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, ...updates };
      }
      return section;
    });

    updateConfig({
      ...config,
      sections: updatedSections
    });
  }, [config, updateConfig]);

  const updateMultipleSections = useCallback((updates: { id: string; updates: Partial<TemplateSection> }[]) => {
    const updatedSections = config.sections.map(section => {
      const update = updates.find(u => u.id === section.id);
      return update ? { ...section, ...update.updates } : section;
    });

    updateConfig({
      ...config,
      sections: updatedSections
    });
  }, [config, updateConfig]);

  const updateField = useCallback((sectionId: string, fieldId: string, updates: Partial<TemplateField>) => {
    const updatedSections = config.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.map(field => {
            if (field.id === fieldId) {
              return { ...field, ...updates };
            }
            return field;
          })
        };
      }
      return section;
    });

    updateConfig({
      ...config,
      sections: updatedSections
    });

    // Update selected field if it's the one being edited
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  }, [config, updateConfig, selectedField]);

  const deleteSection = useCallback((sectionId: string) => {
    updateConfig({
      ...config,
      sections: config.sections.filter(section => section.id !== sectionId)
    });

    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
  }, [config, updateConfig, selectedSection]);

  const deleteField = useCallback((sectionId: string, fieldId: string) => {
    const updatedSections = config.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          fields: section.fields.filter(field => field.id !== fieldId)
        };
      }
      return section;
    });

    updateConfig({
      ...config,
      sections: updatedSections
    });

    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }, [config, updateConfig, selectedField]);

  const handleSave = useCallback(() => {
    const templateData: Partial<KnowledgeTemplate> = {
      ...template,
      title: templateTitle,
      template_type: templateType,
      description: templateDescription,
      config,
      version: template?.version ? String(Number(template.version) + 1) : '1.0',
      updated_at: new Date().toISOString()
    };
    onSave(templateData);
  }, [config, template, templateTitle, templateType, templateDescription, onSave]);

  const handleZoomIn = useCallback(() => {
    setZoom(prevZoom => Math.min(prevZoom + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prevZoom => Math.max(prevZoom - 25, 25));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomFit = useCallback(() => {
    // Calculate zoom to fit canvas in viewport
    if (canvasRef.current) {
      const container = canvasRef.current;
      const containerWidth = container.clientWidth - 64; // Account for margin
      const containerHeight = container.clientHeight - 64;
      const scaleX = containerWidth / config.dimensions.width;
      const scaleY = containerHeight / config.dimensions.height;
      const scale = Math.min(scaleX, scaleY) * 100;
      setZoom(Math.max(25, Math.min(200, scale)));
      setPan({ x: 0, y: 0 });
    }
  }, [config.dimensions]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Shift+click to pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prevZoom => Math.max(25, Math.min(200, prevZoom + delta)));
    }
  }, []);

  // Handle section updates with improved properties integration and snap-to-grid
  const handleSectionUpdate = useCallback((sectionId: string, updates: Partial<TemplateSection>) => {
    // Apply snap-to-grid if enabled
    if (snapToGrid && (updates.x !== undefined || updates.y !== undefined)) {
      if (updates.x !== undefined) {
        updates.x = Math.round(updates.x / gridSize) * gridSize;
      }
      if (updates.y !== undefined) {
        updates.y = Math.round(updates.y / gridSize) * gridSize;
      }
    }
    
    updateSection(sectionId, updates);
    
    // Update selected section if it's the one being edited
    if (selectedSection?.id === sectionId) {
      setSelectedSection({ ...selectedSection, ...updates });
    }
  }, [selectedSection, updateSection, snapToGrid, gridSize]);

  // Handle field updates with improved properties integration
  const handleFieldUpdate = useCallback((sectionId: string, fieldId: string, updates: Partial<TemplateField>) => {
    updateField(sectionId, fieldId, updates);
    
    // Update selected field if it's the one being edited
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  }, [selectedField, updateField]);

  // Alignment handlers
  const handleAlignHorizontal = useCallback((alignmentType: 'left' | 'center' | 'right') => {
    const selectedSections = multiSelection.getSelectedSections(config.sections);
    const updates = alignment.alignHorizontal(selectedSections, alignmentType);
    
    const sectionUpdates = selectedSections.map((section, index) => ({
      id: section.id,
      updates: updates[index]
    }));
    
    updateMultipleSections(sectionUpdates);
  }, [multiSelection, alignment, config.sections, updateMultipleSections]);

  const handleAlignVertical = useCallback((alignmentType: 'top' | 'middle' | 'bottom') => {
    const selectedSections = multiSelection.getSelectedSections(config.sections);
    const updates = alignment.alignVertical(selectedSections, alignmentType);
    
    const sectionUpdates = selectedSections.map((section, index) => ({
      id: section.id,
      updates: updates[index]
    }));
    
    updateMultipleSections(sectionUpdates);
  }, [multiSelection, alignment, config.sections, updateMultipleSections]);

  const handleDistribute = useCallback((direction: 'horizontal' | 'vertical') => {
    const selectedSections = multiSelection.getSelectedSections(config.sections);
    const updates = alignment.distribute(selectedSections, direction);
    
    const sectionUpdates = selectedSections.map((section, index) => ({
      id: section.id,
      updates: updates[index]
    }));
    
    updateMultipleSections(sectionUpdates);
  }, [multiSelection, alignment, config.sections, updateMultipleSections]);

  const handleAlignToCanvas = useCallback((alignmentType: 'center' | 'left' | 'right' | 'top' | 'bottom') => {
    const selectedSections = multiSelection.getSelectedSections(config.sections);
    const updates = alignment.alignToCanvas(selectedSections, config.dimensions, alignmentType);
    
    const sectionUpdates = selectedSections.map((section, index) => ({
      id: section.id,
      updates: updates[index]
    }));
    
    updateMultipleSections(sectionUpdates);
  }, [multiSelection, alignment, config.sections, config.dimensions, updateMultipleSections]);

  // Handle canvas clicks to clear selection
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      multiSelection.clearSelection();
      setSelectedSection(null);
      setSelectedField(null);
      setRightSidebarOpen(false); // Auto-close right sidebar when nothing selected
    }
  }, [multiSelection]);

  // Render left sidebar content
  const renderLeftSidebar = () => {
    if (!leftSidebarOpen) {
      return (
        <CollapsedSidebar
          onAddSection={addSection}
          onAddField={(field) => {
            if (selectedSection) {
              addField(selectedSection.id, field);
            } else if (config.sections.length > 0) {
              addField(config.sections[0].id, field);
            }
          }}
          onExpand={() => setLeftSidebarOpen(true)}
          canAddField={config.sections.length > 0}
        />
      );
    }

    return (
    <>
      <div className="flex gap-2 p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={historyIndex === 0}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={historyIndex === history.length - 1}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button 
          onClick={handleSave} 
          size="sm"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
        <div className="flex gap-1">
          <Button
            variant={activeTab === 'design' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('design')}
          >
            Design
          </Button>
          <Button
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="flex-1">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4 bg-muted h-9">
          <TabsTrigger value="settings" className="text-xs px-2">Setup</TabsTrigger>
          <TabsTrigger value="sections" className="text-xs px-2">Items</TabsTrigger>
          <TabsTrigger value="fields" className="text-xs px-2">Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="p-4">
          <TemplateFieldToolbar
            onAddField={(field) => {
              if (selectedSection) {
                addField(selectedSection.id, field);
              } else if (config.sections.length > 0) {
                addField(config.sections[0].id, field);
              }
            }}
            disabled={config.sections.length === 0}
          />
        </TabsContent>

        <TabsContent value="sections" className="p-4">
          <div className="space-y-4">
            <Button onClick={addSection} className="w-full">
              <Layout className="h-4 w-4 mr-2" />
              Add Section
            </Button>
            
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {config.sections.map((section) => (
                  <Card
                    key={section.id}
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedSection?.id === section.id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <div className="flex items-center justify-between">
                      <InlineTextEditor
                        value={section.title}
                        onChange={(value) => handleSectionUpdate(section.id, { title: value })}
                        className="font-medium flex-1"
                        placeholder="Section title"
                      />
                      <Badge variant="secondary">
                        {section.fields.length} fields
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="p-4">
          <div className="space-y-4">
            {/* Template Metadata */}
            <div className="space-y-4 pb-4 border-b">
              <h4 className="font-medium text-sm">Template Information</h4>
              
              <div>
                <Label htmlFor="template-title">Template Title *</Label>
                <DebouncedTemplateInput
                  id="template-title"
                  value={templateTitle}
                  onUpdate={setTemplateTitle}
                  placeholder="Enter template title"
                />
              </div>

              <div>
                <Label htmlFor="template-type">Template Type *</Label>
                <Select value={templateType} onValueChange={(value) => setTemplateType(value as TemplateType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canvas">Canvas</SelectItem>
                    <SelectItem value="matrix">Matrix</SelectItem>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="process">Process</SelectItem>
                    <SelectItem value="form">Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Optional description"
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Canvas Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Canvas Settings</h4>
              
              <div>
                <Label htmlFor="layout">Layout Type</Label>
                <Select 
                  value={config.layout} 
                  onValueChange={(value) => updateConfig({
                    ...config,
                    layout: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canvas">Canvas</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="form">Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={config.dimensions.width}
                    onChange={(e) => updateConfig({
                      ...config,
                      dimensions: {
                        ...config.dimensions,
                        width: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={config.dimensions.height}
                    onChange={(e) => updateConfig({
                      ...config,
                      dimensions: {
                        ...config.dimensions,
                        height: Number(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
    );
  };

  const renderRightSidebar = () => (
    <ImprovedPropertiesPanel
      selectedSection={selectedSection}
      selectedField={selectedField}
      onUpdateSection={(updates) => {
        if (selectedSection) {
          handleSectionUpdate(selectedSection.id, updates);
        }
      }}
      onUpdateField={(updates) => {
        if (selectedField && selectedSection) {
          handleFieldUpdate(selectedSection.id, selectedField.id, updates);
        }
      }}
      onDeleteSection={() => {
        if (selectedSection) {
          deleteSection(selectedSection.id);
        }
      }}
      onDeleteField={() => {
        if (selectedField && selectedSection) {
          deleteField(selectedSection.id, selectedField.id);
        }
      }}
    />
  );

  const renderToolbar = () => (
    <BottomToolbar
      snapToGrid={snapToGrid}
      onToggleSnapToGrid={setSnapToGrid}
      gridSize={gridSize}
      showGrid={showGrid}
      onToggleShowGrid={setShowGrid}
      onGridSizeChange={setGridSize}
      showSectionTitles={showSectionTitles}
      onToggleSectionTitles={setShowSectionTitles}
      selectedItemsCount={multiSelection.selectedSectionIds.length}
      selectedField={selectedField}
      onAlignHorizontal={handleAlignHorizontal}
      onAlignVertical={handleAlignVertical}
      onDistribute={(direction) => {
        const updates = alignment.distribute(
          multiSelection.selectedSectionIds.map(id => 
            config.sections.find(s => s.id === id)!
          ).filter(Boolean),
          direction
        );
        updates.forEach((update, index) => {
          const sectionId = multiSelection.selectedSectionIds[index];
          if (sectionId && update) {
            handleSectionUpdate(sectionId, update);
          }
        });
      }}
      onAlignToCanvas={(alignmentType) => {
        const updates = alignment.alignToCanvas(
          multiSelection.selectedSectionIds.map(id => 
            config.sections.find(s => s.id === id)!
          ).filter(Boolean),
          config.dimensions,
          alignmentType
        );
        updates.forEach((update, index) => {
          const sectionId = multiSelection.selectedSectionIds[index];
          if (sectionId && update) {
            handleSectionUpdate(sectionId, update);
          }
        });
      }}
      onTextFormat={(format) => {
        // Text formatting logic
        console.log('Text format:', format);
      }}
      onTextAlign={(alignment) => {
        // Text alignment logic
        console.log('Text align:', alignment);
      }}
      onInsertList={(type) => {
        // List insertion logic
        console.log('Insert list:', type);
      }}
      zoom={zoom}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onZoomReset={handleZoomReset}
      onZoomFit={handleZoomFit}
      rightSidebarOpen={rightSidebarOpen}
      onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
    />
  );

  const renderCanvas = () => {
    if (activeTab === 'preview') {
      return <TemplatePreview config={config} />;
    }

    return (
      <div className="relative w-full h-full overflow-auto bg-gradient-to-br from-muted/30 to-muted/50">
        {/* Infinite Grid Background */}
        <TemplateGrid
          show={showGrid}
          size={gridSize}
          canvasWidth={config.dimensions.width}
          canvasHeight={config.dimensions.height}
          zoom={zoom}
        />

        <div
          ref={canvasRef}
          className="relative flex items-center justify-center min-h-full min-w-full p-16"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        >
          <div
            className="relative bg-background rounded-xl shadow-2xl ring-1 ring-border/20"
            style={{
              width: config.dimensions.width,
              height: config.dimensions.height,
              backgroundColor: config.styling?.backgroundColor || 'hsl(var(--background))',
              transform: `scale(${zoom / 100}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center center',
            }}
          >
            {config.sections.map((section) => (
              <TemplateSectionEditor
                key={section.id}
                section={section}
                isSelected={multiSelection.isSelected(section.id)}
                selectedField={selectedField}
                canvasDimensions={config.dimensions}
                zoom={zoom}
                pan={pan}
                showTitle={showSectionTitles}
                snapToGrid={snapToGrid}
                gridSize={gridSize}
                onSelect={(section, isCtrlPressed) => {
                  multiSelection.selectSection(section, isCtrlPressed);
                  setSelectedSection(section);
                }}
                onSelectField={(field) => {
                  setSelectedField(field);
                }}
                onUpdate={(updates) => handleSectionUpdate(section.id, updates)}
                onUpdateField={(fieldId, updates) => handleFieldUpdate(section.id, fieldId, updates)}
                onDelete={() => deleteSection(section.id)}
                onDeleteField={(fieldId) => deleteField(section.id, fieldId)}
              />
            ))}

            {config.sections.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Empty Canvas</p>
                  <p className="text-sm">Add sections from the left sidebar to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom indicator */}
        {zoom !== 100 && (
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Zoom:</span>
              <span className="font-medium">{zoom}%</span>
            </div>
          </div>
        )}

        {/* Pan instruction */}
        {zoom > 100 && (
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded px-3 py-2 text-sm text-muted-foreground">
            <Move3D className="h-4 w-4 inline mr-2" />
            Hold Shift + drag or middle-click to pan
          </div>
        )}
      </div>
    );
  };

  return (
    <TemplateDesignLayout
      leftSidebar={renderLeftSidebar()}
      rightSidebar={renderRightSidebar()}
      toolbar={renderToolbar()}
      leftSidebarOpen={leftSidebarOpen}
      rightSidebarOpen={rightSidebarOpen}
      onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
      onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
    >
      {renderCanvas()}
    </TemplateDesignLayout>
  );
};