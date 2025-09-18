import { useNavigate, useParams } from 'react-router-dom';
import { EnhancedTemplateBuilder } from '@/components/admin/templates/EnhancedTemplateBuilder';
import { useCreateKnowledgeTemplate, useUpdateKnowledgeTemplate, useKnowledgeTemplate } from '@/hooks/useKnowledgeTemplates';
import type { KnowledgeTemplate, TemplateConfig, TemplateType } from '@/types/template';
import type { EnhancedKnowledgeTemplate, EnhancedTemplateConfig } from '@/types/template-enhanced';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Helper functions to convert between legacy and enhanced formats
function convertToEnhancedTemplate(legacy: KnowledgeTemplate): EnhancedKnowledgeTemplate {
  return {
    id: legacy.id,
    title: legacy.title,
    description: legacy.description,
    template_type: (legacy.template_type === 'process' ? 'canvas' : legacy.template_type) as any,
    config: convertToEnhancedConfig(legacy.config),
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
    category: legacy.category,
    tags: [],
    version: legacy.version,
    is_public: legacy.is_public,
    usage_count: legacy.usage_count,
    created_at: legacy.created_at,
    updated_at: legacy.updated_at,
    created_by: legacy.created_by,
    updated_by: legacy.updated_by,
  };
}

function convertToEnhancedConfig(legacy: TemplateConfig): EnhancedTemplateConfig {
  return {
    canvas: {
      dimensions: legacy.dimensions,
      grid: { enabled: true, size: 20, snap: true, visible: true, color: '#e5e7eb' },
      background: { color: legacy.styling?.backgroundColor || '#ffffff', pattern: 'none' },
      export: { formats: ['png', 'jpeg', 'pdf', 'svg'], quality: 1, dpi: 300 },
      collaboration: { enabled: false, cursors: false, comments: false, realtime: false },
    },
    elements: legacy.sections.map(section => ({
      id: section.id,
      type: 'container' as const,
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
      zIndex: 0,
      style: {
        fill: section.backgroundColor || '#f9fafb',
        stroke: section.borderColor || '#d1d5db',
        strokeWidth: 1,
        opacity: 1,
        visible: true,
        locked: false,
      },
      constraints: { resizable: true, draggable: true, snapToGrid: true },
      content: {
        type: 'container',
        children: section.fields.map(f => f.id),
        layout: 'free',
      },
      name: section.title,
    })),
    groups: {},
    layers: {},
    theme: {
      primaryColor: legacy.styling?.primaryColor || 'hsl(var(--primary))',
      secondaryColor: legacy.styling?.secondaryColor || 'hsl(var(--secondary))',
      accentColor: 'hsl(var(--accent))',
      backgroundColor: legacy.styling?.backgroundColor || 'hsl(var(--background))',
      textColor: 'hsl(var(--foreground))',
      fontFamily: legacy.styling?.fontFamily || 'Inter, sans-serif',
    },
    version: '1.0.0',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    compatibility: ['1.0.0'],
  };
}

function convertToLegacyConfig(enhanced: EnhancedTemplateConfig): TemplateConfig {
  return {
    layout: 'canvas' as const,
    dimensions: enhanced.canvas.dimensions,
    sections: enhanced.elements
      .filter(el => el.content.type === 'container')
      .map(el => ({
        id: el.id,
        title: el.name || 'Section',
        description: '',
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        backgroundColor: el.style.fill as string,
        borderColor: el.style.stroke as string,
        fields: [], // Convert fields if needed
      })),
    styling: {
      backgroundColor: enhanced.theme.backgroundColor,
      fontFamily: enhanced.theme.fontFamily,
      primaryColor: enhanced.theme.primaryColor,
      secondaryColor: enhanced.theme.secondaryColor,
    },
  };
}

export default function CreateKnowledgeTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: template, isLoading } = useKnowledgeTemplate(id);
  const createMutation = useCreateKnowledgeTemplate();
  const updateMutation = useUpdateKnowledgeTemplate();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async (templateData: Partial<EnhancedKnowledgeTemplate>) => {
    try {
      if (isEditing && id) {
        // Convert enhanced template back to legacy format for saving
        const mappedTemplateType: TemplateType = templateData.template_type === 'document' ? 'canvas' : (templateData.template_type as TemplateType);
        
        const legacyData: Partial<KnowledgeTemplate> = {
          title: templateData.title,
          description: templateData.description,
          template_type: mappedTemplateType,
          config: templateData.config ? convertToLegacyConfig(templateData.config) : undefined,
          is_public: templateData.is_public,
          version: templateData.version,
        };
        
        await updateMutation.mutateAsync({
          id,
          data: legacyData
        });
        toast.success('Template updated successfully');
      } else {
        if (!templateData.title || !templateData.template_type) {
          toast.error('Template title and type are required');
          return;
        }
        
        const mappedTemplateType: TemplateType = templateData.template_type === 'document' ? 'canvas' : (templateData.template_type as TemplateType);
        
        const legacyTemplate = {
          title: templateData.title!,
          description: templateData.description,
          template_type: mappedTemplateType,
          is_public: templateData.is_public || false,
          config: templateData.config ? convertToLegacyConfig(templateData.config) : undefined,
        };
        
        const newTemplate = await createMutation.mutateAsync(legacyTemplate);
        navigate(`/admin/knowledge/templates/${newTemplate.id}/edit`);
        toast.success('Template created successfully');
      }
    } catch (error) {
      console.error('Template save error:', error);
      toast.error('Failed to save template');
    }
  };

  const handlePreview = (config: EnhancedTemplateConfig) => {
    toast.success('Preview mode activated! The template is now displayed in preview mode.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  // If editing but template not found
  if (isEditing && !template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Template not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center gap-4 p-4 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/knowledge/templates')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h1>
        </div>
      </div>
      
      <div className="flex-1">
        <EnhancedTemplateBuilder
          template={template ? convertToEnhancedTemplate(template) : undefined}
          onSave={handleSave}
          onPreview={handlePreview}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}