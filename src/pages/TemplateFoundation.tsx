import React from 'react';
import { EnhancedTemplateBuilder } from '@/components/admin/templates/EnhancedTemplateBuilder';
import type { EnhancedKnowledgeTemplate, EnhancedTemplateConfig } from '@/types/template-enhanced';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Demo template with foundation phase capabilities
const getDemoTemplate = (): EnhancedKnowledgeTemplate => ({
  id: 'demo-foundation',
  title: 'Foundation Phase Demo Template',
  description: 'Demonstrating the new enhanced template builder with Fabric.js integration',
  template_type: 'canvas',
  config: {
    canvas: {
      dimensions: { width: 1200, height: 800 },
      grid: { enabled: true, size: 20, snap: true, visible: true, color: '#e5e7eb' },
      background: { color: '#ffffff', pattern: 'none' },
      export: { formats: ['png', 'jpeg', 'pdf', 'svg'], quality: 1, dpi: 300 },
      collaboration: { enabled: false, cursors: false, comments: false, realtime: false },
    },
    elements: [
      {
        id: 'demo-text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 300,
        height: 50,
        zIndex: 1,
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: 'hsl(var(--primary))',
          textAlign: 'left',
          opacity: 1,
          visible: true,
          locked: false,
        },
        constraints: { resizable: true, draggable: true, snapToGrid: true },
        content: {
          type: 'text',
          textType: 'heading',
          text: 'Foundation Phase Demo',
          editable: true,
        },
        name: 'Main Heading',
      },
      {
        id: 'demo-shape-1',
        type: 'shape',
        x: 500,
        y: 150,
        width: 200,
        height: 100,
        zIndex: 2,
        style: {
          fill: 'hsl(var(--primary) / 0.1)',
          stroke: 'hsl(var(--primary))',
          strokeWidth: 2,
          borderRadius: 8,
          opacity: 1,
          visible: true,
          locked: false,
        },
        constraints: { resizable: true, draggable: true, snapToGrid: true },
        content: {
          type: 'shape',
          shapeType: 'rectangle',
        },
        name: 'Demo Rectangle',
      },
      {
        id: 'demo-text-2',
        type: 'text',
        x: 100,
        y: 200,
        width: 350,
        height: 120,
        zIndex: 3,
        style: {
          fontSize: 14,
          color: 'hsl(var(--foreground))',
          textAlign: 'left',
          lineHeight: 1.5,
          opacity: 1,
          visible: true,
          locked: false,
        },
        constraints: { resizable: true, draggable: true, snapToGrid: true },
        content: {
          type: 'text',
          textType: 'plain',
          text: 'This is the new Foundation Phase template builder powered by Fabric.js. You can now:\n\n• Drag and drop elements\n• Resize with visual handles\n• Professional canvas manipulation\n• Real-time visual editing',
          editable: true,
        },
        name: 'Description Text',
      }
    ],
    groups: {
      'demo-group': ['demo-text-1', 'demo-text-2']
    },
    layers: {
      'content': ['demo-text-1', 'demo-text-2'],
      'shapes': ['demo-shape-1']
    },
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
  },
  canvas_config: {
    dimensions: { width: 1200, height: 800 },
    grid: { enabled: true, size: 20, snap: true, visible: true, color: '#e5e7eb' },
    background: { color: '#ffffff', pattern: 'none' },
    export: { formats: ['png', 'jpeg', 'pdf', 'svg'], quality: 1, dpi: 300 },
    collaboration: { enabled: false, cursors: false, comments: false, realtime: false },
  },
  assets: [],
  collaboration: {
    shared_with: [],
    permissions: {},
  },
  category: 'demo',
  tags: ['foundation', 'demo', 'canvas'],
  version: '1.0.0',
  is_public: true,
  usage_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default function TemplateFoundation() {
  const navigate = useNavigate();

  const handleSave = async (templateData: Partial<EnhancedKnowledgeTemplate>) => {
    toast.success('Foundation Phase Demo - Template saved successfully!');
    console.log('Demo template data:', templateData);
  };

  const handlePreview = (config: EnhancedTemplateConfig) => {
    toast.success('Foundation Phase Demo - Preview mode activated!');
    console.log('Demo preview config:', config);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Foundation Phase - Enhanced Template Builder</h1>
          <p className="text-sm text-muted-foreground">
            Experience the new Fabric.js-powered template builder with drag & drop, visual editing, and professional canvas tools
          </p>
        </div>
      </div>
      
      <div className="flex-1">
        <EnhancedTemplateBuilder
          template={getDemoTemplate()}
          onSave={handleSave}
          onPreview={handlePreview}
          isSaving={false}
        />
      </div>
    </div>
  );
}