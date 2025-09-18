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
        y: 50,
        width: 400,
        height: 60,
        zIndex: 1,
        style: {
          fontSize: 32,
          fontWeight: 'bold',
          color: 'hsl(217 91% 60%)', // Primary color
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
        x: 600,
        y: 100,
        width: 200,
        height: 120,
        zIndex: 2,
        style: {
          fill: 'hsl(217 91% 95%)', // Light primary
          stroke: 'hsl(217 91% 60%)', // Primary
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
        id: 'demo-circle-1',
        type: 'shape',
        x: 850,
        y: 150,
        width: 100,
        height: 100,
        zIndex: 3,
        style: {
          fill: 'hsl(142 71% 45%)', // Success color
          stroke: 'hsl(142 71% 35%)',
          strokeWidth: 2,
          opacity: 0.8,
          visible: true,
          locked: false,
        },
        constraints: { resizable: true, draggable: true, snapToGrid: true },
        content: {
          type: 'shape',
          shapeType: 'circle',
        },
        name: 'Demo Circle',
      },
      {
        id: 'demo-text-2',
        type: 'text',
        x: 100,
        y: 150,
        width: 450,
        height: 180,
        zIndex: 4,
        style: {
          fontSize: 16,
          color: 'hsl(222 84% 5%)', // Foreground
          textAlign: 'left',
          lineHeight: 1.6,
          opacity: 1,
          visible: true,
          locked: false,
        },
        constraints: { resizable: true, draggable: true, snapToGrid: true },
        content: {
          type: 'text',
          textType: 'plain',
          text: 'Welcome to the new Foundation Phase! This enhanced template builder is powered by Fabric.js and offers:\n\n• Drag and drop elements anywhere on the canvas\n• Resize with visual handles and corner controls\n• Professional canvas manipulation tools\n• Real-time visual editing capabilities\n• Grid snapping and alignment assistance\n• Multi-element selection and grouping',
          editable: true,
        },
        name: 'Description Text',
      },
      {
        id: 'demo-text-3',
        type: 'text',
        x: 100,
        y: 400,
        width: 600,
        height: 40,
        zIndex: 5,
        style: {
          fontSize: 18,
          fontWeight: '600',
          color: 'hsl(262 83% 58%)', // Accent
          textAlign: 'left',
          opacity: 1,
          visible: true,
          locked: false,
        },
        constraints: { resizable: true, draggable: true, snapToGrid: true },
        content: {
          type: 'text',
          textType: 'heading',
          text: 'Try interacting with these elements!',
          editable: true,
        },
        name: 'Interaction Prompt',
      },
      {
        id: 'demo-text-4',
        type: 'text',
        x: 100,
        y: 460,
        width: 500,
        height: 100,
        zIndex: 6,
        style: {
          fontSize: 14,
          color: 'hsl(215 16% 47%)', // Muted foreground
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
          text: 'Click and drag elements to move them around. Use the corner handles to resize. Select multiple elements by holding Shift. The toolbar on the left lets you add new elements, and the properties panel on the right shows options for selected items.',
          editable: true,
        },
        name: 'Instructions',
      }
    ],
    groups: {
      'demo-group': ['demo-text-1', 'demo-text-2']
    },
    layers: {
      'content': ['demo-text-1', 'demo-text-2', 'demo-text-3', 'demo-text-4'],
      'shapes': ['demo-shape-1', 'demo-circle-1']
    },
    theme: {
      primaryColor: 'hsl(217 91% 60%)',
      secondaryColor: 'hsl(210 40% 98%)',
      accentColor: 'hsl(262 83% 58%)',
      backgroundColor: 'hsl(0 0% 100%)',
      textColor: 'hsl(222 84% 5%)',
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