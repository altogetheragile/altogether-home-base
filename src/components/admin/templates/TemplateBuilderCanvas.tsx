import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TemplateFieldToolbar } from './TemplateFieldToolbar';
import { TemplateFieldEditor } from './TemplateFieldEditor';
import { TemplatePreview } from './TemplatePreview';
import { TemplateSectionEditor } from './TemplateSectionEditor';
import type { KnowledgeTemplate, TemplateConfig, TemplateField, TemplateSection } from '@/types/template';
import { Save, Eye, Undo, Redo, Grid, Layout, Settings, ZoomIn, ZoomOut, RotateCcw, Move3D, Minimize2 } from 'lucide-react';

interface TemplateBuilderCanvasProps {
  template?: KnowledgeTemplate;
  onSave: (template: Partial<KnowledgeTemplate>) => void;
  onPreview: (config: TemplateConfig) => void;
}

export const TemplateBuilderCanvas: React.FC<TemplateBuilderCanvasProps> = ({
  template,
  onSave,
  onPreview
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

  const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
  const [selectedSection, setSelectedSection] = useState<TemplateSection | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'preview'>('design');
  const [history, setHistory] = useState<TemplateConfig[]>([config]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPropertiesMinimized, setIsPropertiesMinimized] = useState(false);

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
      config,
      version: template?.version ? String(Number(template.version) + 1) : '1.0',
      updated_at: new Date().toISOString()
    };
    onSave(templateData);
  }, [config, template, onSave]);

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

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Tools */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Template Builder</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={historyIndex === 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={historyIndex === history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(config)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        <Tabs defaultValue="fields" className="flex-1">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                        <span className="font-medium">{section.title}</span>
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
              <div>
                <Label htmlFor="layout">Layout Type</Label>
                <select
                  id="layout"
                  value={config.layout}
                  onChange={(e) => updateConfig({
                    ...config,
                    layout: e.target.value as any
                  })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="canvas">Canvas</option>
                  <option value="grid">Grid</option>
                  <option value="form">Form</option>
                </select>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {template?.title || 'New Template'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {config.sections.length} sections • {config.layout} layout
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="design">
                    <Grid className="h-4 w-4 mr-2" />
                    Design
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Zoom Controls */}
              {activeTab === 'design' && (
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[50px] text-center">
                    {zoom}%
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button variant="ghost" size="sm" onClick={handleZoomFit} title="Fit to screen">
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleZoomReset} title="Reset zoom">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsPropertiesOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Properties
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'design' ? (
            <div
              ref={canvasRef}
              className="absolute inset-0 bg-muted/20 cursor-grab"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            >
              <div
                className="relative bg-background border rounded-lg shadow-lg origin-top-left"
                style={{
                  width: config.dimensions.width,
                  height: config.dimensions.height,
                  backgroundColor: config.styling.backgroundColor,
                  transform: `translate(${32 + pan.x}px, ${32 + pan.y}px) scale(${zoom / 100})`,
                }}
              >
                {config.sections.map((section) => (
                  <TemplateSectionEditor
                    key={section.id}
                    section={section}
                    isSelected={selectedSection?.id === section.id}
                    selectedField={selectedField}
                    canvasDimensions={config.dimensions}
                    zoom={zoom}
                    pan={pan}
                    onSelect={(section) => {
                      setSelectedSection(section);
                    }}
                    onSelectField={(field) => {
                      setSelectedField(field);
                    }}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                    onUpdateField={(fieldId, updates) => updateField(section.id, fieldId, updates)}
                    onDelete={() => deleteSection(section.id)}
                    onDeleteField={(fieldId) => deleteField(section.id, fieldId)}
                  />
                ))}
              </div>
              
              {/* Pan instruction */}
              {zoom > 100 && (
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  <Move3D className="h-4 w-4 inline mr-2" />
                  Hold Shift + drag or middle-click to pan
                </div>
              )}
            </div>
          ) : (
            <TemplatePreview config={config} />
          )}
        </div>

        {/* Floating Properties Panel */}
        <Dialog open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen}>
          <DialogContent
            className="max-w-sm max-h-[80vh] overflow-y-auto pointer-events-auto"
            style={{
              position: 'fixed',
              top: '10%',
              right: '2%',
              left: 'auto',
              transform: 'none',
            }}
          >
            <DialogHeader className="flex flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-base">Properties</DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPropertiesMinimized(!isPropertiesMinimized)}
                  className="h-6 w-6 p-0"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </div>
            </DialogHeader>
            
            {!isPropertiesMinimized && (
              <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                {selectedField ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <TemplateFieldEditor
                      field={selectedField}
                      onUpdate={(updates) => {
                        const section = config.sections.find(s => 
                          s.fields.some(f => f.id === selectedField.id)
                        );
                        if (section) {
                          updateField(section.id, selectedField.id, updates);
                        }
                      }}
                    />
                  </div>
                ) : selectedSection ? (
                  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <Label htmlFor="section-title">Section Title</Label>
                      <Input
                        id="section-title"
                        value={selectedSection.title}
                        onChange={(e) => updateSection(selectedSection.id, {
                          title: e.target.value
                        })}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="section-desc">Description</Label>
                      <Input
                        id="section-desc"
                        value={selectedSection.description || ''}
                        onChange={(e) => updateSection(selectedSection.id, {
                          description: e.target.value
                        })}
                        placeholder="Optional description"
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="section-x">X Position</Label>
                        <Input
                          id="section-x"
                          type="number"
                          value={selectedSection.x}
                          onChange={(e) => updateSection(selectedSection.id, {
                            x: Number(e.target.value)
                          })}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <Label htmlFor="section-y">Y Position</Label>
                        <Input
                          id="section-y"
                          type="number"
                          value={selectedSection.y}
                          onChange={(e) => updateSection(selectedSection.id, {
                            y: Number(e.target.value)
                          })}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="section-width">Width</Label>
                        <Input
                          id="section-width"
                          type="number"
                          value={selectedSection.width}
                          onChange={(e) => updateSection(selectedSection.id, {
                            width: Number(e.target.value)
                          })}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <Label htmlFor="section-height">Height</Label>
                        <Input
                          id="section-height"
                          type="number"
                          value={selectedSection.height}
                          onChange={(e) => updateSection(selectedSection.id, {
                            height: Number(e.target.value)
                          })}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <Separator />
                    
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        deleteSection(selectedSection.id);
                        setIsPropertiesOpen(false);
                      }}
                    >
                      Delete Section
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a section or field to edit properties</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};