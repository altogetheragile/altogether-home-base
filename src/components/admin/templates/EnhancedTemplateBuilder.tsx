import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplateDesignLayout } from './TemplateDesignLayout';
import FabricTemplateCanvas from '@/components/canvas/FabricTemplateCanvas';
import type { FabricTemplateCanvasRef } from '@/components/canvas/FabricTemplateCanvas';
import type { 
  EnhancedKnowledgeTemplate, 
  EnhancedTemplateConfig,
  TemplateElementType,
  CanvasSelection 
} from '@/types/template-enhanced';
import { 
  Save, Eye, Undo, Redo, ZoomIn, ZoomOut, RotateCcw, 
  Type, Square, Circle, Image, Container, MousePointer,
  Move, Download, Upload, Grid, Settings, Layers,
  Trash2, Copy, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Bold, Italic, Underline
} from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedTemplateBuilderProps {
  template?: EnhancedKnowledgeTemplate;
  onSave: (template: Partial<EnhancedKnowledgeTemplate>) => void;
  onPreview: (config: EnhancedTemplateConfig) => void;
  isSaving?: boolean;
}

export const EnhancedTemplateBuilder: React.FC<EnhancedTemplateBuilderProps> = ({
  template,
  onSave,
  onPreview,
  isSaving = false
}) => {
  const canvasRef = useRef<FabricTemplateCanvasRef>(null);
  
  const [config, setConfig] = useState<EnhancedTemplateConfig>(
    template?.config || getDefaultConfig()
  );
  
  const [templateTitle, setTemplateTitle] = useState(template?.title || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedElements, setSelectedElements] = useState<CanvasSelection>({ elementIds: [] });
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'shape' | 'image'>('select');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const handleConfigChange = useCallback((newConfig: EnhancedTemplateConfig) => {
    setConfig(newConfig);
  }, []);

  const handleSelectionChange = useCallback((selection: CanvasSelection) => {
    setSelectedElements(selection);
    setRightSidebarOpen(selection.elementIds.length > 0);
  }, []);

  const handleSave = useCallback(() => {
    const templateData: Partial<EnhancedKnowledgeTemplate> = {
      title: templateTitle,
      description: templateDescription,
      config,
      canvas_config: config.canvas,
      template_type: 'canvas',
      version: config.version,
    };
    
    onSave(templateData);
    toast.success('Template saved successfully');
  }, [templateTitle, templateDescription, config, onSave]);

  const handlePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
    if (!isPreviewMode) {
      onPreview(config);
    }
  }, [isPreviewMode, config, onPreview]);

  const handleAddElement = useCallback((type: TemplateElementType) => {
    canvasRef.current?.addElement(type);
    setActiveTool('select');
  }, []);

  const handleDeleteSelected = useCallback(() => {
    canvasRef.current?.deleteSelected();
  }, []);

  const handleExport = useCallback(async (format: 'png' | 'jpeg' | 'pdf' | 'svg') => {
    try {
      const dataUrl = await canvasRef.current?.exportCanvas(format);
      if (dataUrl) {
        // Create download link
        const link = document.createElement('a');
        link.download = `${templateTitle || 'template'}.${format}`;
        link.href = dataUrl;
        link.click();
        toast.success(`Template exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Failed to export template');
      console.error('Export error:', error);
    }
  }, [templateTitle]);

  const renderTopToolbar = () => (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant={isPreviewMode ? "default" : "outline"}
          size="sm"
          onClick={handlePreview}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {isPreviewMode ? 'Design Mode' : 'Preview'}
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button variant="outline" size="sm" onClick={() => canvasRef.current?.undo()}>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => canvasRef.current?.redo()}>
          <Redo className="w-4 h-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button variant="outline" size="sm" onClick={() => canvasRef.current?.zoomToFit()}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('png')}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export PNG
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );

  const renderLeftSidebar = () => (
    <Card className="h-full p-4">
      <ScrollArea className="h-full">
        <Tabs defaultValue="elements">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="layers">Layers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="elements" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Basic Elements</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddElement('text')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Type className="w-4 h-4" />
                  <span className="text-xs">Text</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddElement('shape')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Square className="w-4 h-4" />
                  <span className="text-xs">Shape</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddElement('image')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Image className="w-4 h-4" />
                  <span className="text-xs">Image</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddElement('container')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Container className="w-4 h-4" />
                  <span className="text-xs">Container</span>
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-sm font-medium">Templates</Label>
              <div className="space-y-2 mt-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  SWOT Analysis
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Persona Card
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Journey Map
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="setup" className="space-y-4">
            <div>
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="Enter template title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-sm font-medium">Canvas Settings</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Grid</span>
                  <Button variant="outline" size="sm">
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="layers" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Layers</Label>
              <Button variant="outline" size="sm">
                <Layers className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {config.elements.map((element, index) => (
                <div
                  key={element.id}
                  className="flex items-center justify-between p-2 rounded border border-border hover:bg-accent"
                >
                  <span className="text-sm capitalize">{element.content.type}</span>
                  <Badge variant="secondary" className="text-xs">
                    {config.elements.length - index}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </Card>
  );

  const renderRightSidebar = () => (
    <Card className="h-full p-4">
      <ScrollArea className="h-full">
        {selectedElements.elementIds.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Properties</Label>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input placeholder="X" className="text-sm" />
                  <Input placeholder="Y" className="text-sm" />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Size</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input placeholder="Width" className="text-sm" />
                  <Input placeholder="Height" className="text-sm" />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Styling</Label>
                <div className="space-y-2 mt-1">
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <Bold className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Italic className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Underline className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <AlignLeft className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <AlignCenter className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <AlignRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an element to edit properties</p>
          </div>
        )}
      </ScrollArea>
    </Card>
  );

  const renderBottomToolbar = () => (
    <div className="flex items-center justify-between p-2 border-t border-border bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant={activeTool === 'select' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('select')}
        >
          <MousePointer className="w-4 h-4" />
        </Button>
        <Button
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('text')}
        >
          <Type className="w-4 h-4" />
        </Button>
        <Button
          variant={activeTool === 'shape' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTool('shape')}
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {config.elements.length} elements
        </span>
        <Badge variant="secondary" className="text-xs">
          100%
        </Badge>
      </div>
    </div>
  );

  if (isPreviewMode) {
    return (
      <div className="h-full flex flex-col">
        {renderTopToolbar()}
        <div className="flex-1 p-4 bg-accent/5">
          <div className="w-full h-full flex items-center justify-center">
            <FabricTemplateCanvas
              ref={canvasRef}
              config={config}
              isEditable={false}
              className="shadow-lg"
              width={800}
              height={600}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TemplateDesignLayout
      leftSidebar={renderLeftSidebar()}
      rightSidebar={renderRightSidebar()}
      toolbar={renderBottomToolbar()}
      leftSidebarOpen={leftSidebarOpen}
      rightSidebarOpen={rightSidebarOpen}
      onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
      onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
    >
      <div className="h-full flex flex-col">
        {renderTopToolbar()}
        <div className="flex-1 p-4 bg-accent/5">
          <div className="w-full h-full flex items-center justify-center">
            <FabricTemplateCanvas
              ref={canvasRef}
              config={config}
              isEditable={true}
              onConfigChange={handleConfigChange}
              onSelectionChange={handleSelectionChange}
              className="shadow-lg"
              width={800}
              height={600}
            />
          </div>
        </div>
      </div>
    </TemplateDesignLayout>
  );
};

// Helper function to get default config
function getDefaultConfig(): EnhancedTemplateConfig {
  return {
    canvas: {
      dimensions: { width: 1200, height: 800 },
      grid: {
        enabled: true,
        size: 20,
        snap: true,
        visible: true,
        color: '#e5e7eb',
      },
      background: {
        color: '#ffffff',
        pattern: 'none',
      },
      export: {
        formats: ['png', 'jpeg', 'pdf', 'svg'],
        quality: 1,
        dpi: 300,
      },
      collaboration: {
        enabled: false,
        cursors: false,
        comments: false,
        realtime: false,
      },
    },
    elements: [],
    groups: {},
    layers: {},
    theme: {
      primaryColor: 'hsl(var(--primary))',
      secondaryColor: 'hsl(var(--secondary))',
      accentColor: 'hsl(var(--accent))',
      backgroundColor: 'hsl(var(--background))',
      textColor: 'hsl(var(--foreground))',
      fontFamily: 'Inter, sans-serif',
    },
    version: '1.0.0',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    compatibility: ['1.0.0'],
  };
}