import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TemplateFieldToolbar } from './TemplateFieldToolbar';
import { TemplateFieldEditor } from './TemplateFieldEditor';
import { TemplatePreview } from './TemplatePreview';
import { TemplateSectionEditor } from './TemplateSectionEditor';
import type { KnowledgeTemplate, TemplateConfig, TemplateField, TemplateSection } from '@/types/template';
import { Save, Eye, Undo, Redo, Grid, Layout, Settings } from 'lucide-react';

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
              
              <Sheet open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Properties
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80">
                  <SheetHeader>
                    <SheetTitle>Properties</SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6">
                    {selectedField ? (
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
                    ) : selectedSection ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="section-title">Section Title</Label>
                          <Input
                            id="section-title"
                            value={selectedSection.title}
                            onChange={(e) => updateSection(selectedSection.id, {
                              title: e.target.value
                            })}
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
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'design' ? (
            <div
              ref={canvasRef}
              className="absolute inset-0 bg-muted/20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
            >
              <div
                className="relative bg-background border rounded-lg m-8 shadow-lg"
                style={{
                  width: config.dimensions.width,
                  height: config.dimensions.height,
                  backgroundColor: config.styling.backgroundColor
                }}
              >
                {config.sections.map((section) => (
                  <TemplateSectionEditor
                    key={section.id}
                    section={section}
                    isSelected={selectedSection?.id === section.id}
                    selectedField={selectedField}
                    onSelect={(section) => {
                      setSelectedSection(section);
                      setIsPropertiesOpen(true);
                    }}
                    onSelectField={(field) => {
                      setSelectedField(field);
                      setIsPropertiesOpen(true);
                    }}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                    onUpdateField={(fieldId, updates) => updateField(section.id, fieldId, updates)}
                    onDelete={() => deleteSection(section.id)}
                    onDeleteField={(fieldId) => deleteField(section.id, fieldId)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <TemplatePreview config={config} />
          )}
        </div>
      </div>
    </div>
  );
};