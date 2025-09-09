import { useNavigate, useParams } from 'react-router-dom';
import { TemplateBuilderCanvas } from '@/components/admin/templates/TemplateBuilderCanvas';
import { useCreateKnowledgeTemplate, useUpdateKnowledgeTemplate, useKnowledgeTemplate } from '@/hooks/useKnowledgeTemplates';
import type { KnowledgeTemplate, TemplateConfig } from '@/types/template';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreateKnowledgeTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: template, isLoading } = useKnowledgeTemplate(id);
  const createMutation = useCreateKnowledgeTemplate();
  const updateMutation = useUpdateKnowledgeTemplate();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async (templateData: Partial<KnowledgeTemplate>) => {
    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync({
          id,
          data: templateData
        });
        toast.success('Template updated successfully');
      } else {
        if (!templateData.title || !templateData.template_type) {
          toast.error('Template title and type are required');
          return;
        }
        
        const newTemplate = await createMutation.mutateAsync({
          title: templateData.title!,
          description: templateData.description,
          template_type: templateData.template_type!,
          is_public: templateData.is_public || false
        });
        
        toast.success('Template created successfully');
        navigate(`/admin/knowledge/templates/${newTemplate.id}/edit`);
      }
    } catch (error) {
      toast.error(isEditing ? 'Failed to update template' : 'Failed to create template');
      console.error('Template save error:', error);
    }
  };

  const handlePreview = (config: TemplateConfig) => {
    // Open preview in a new window or modal
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Template Preview</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f8f9fa;
              }
              .preview-container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
            </style>
          </head>
          <body>
            <div class="preview-container">
              <h1>Template Preview</h1>
              <p>Template configuration:</p>
              <pre>${JSON.stringify(config, null, 2)}</pre>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
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
        <TemplateBuilderCanvas
          template={template || undefined}
          onSave={handleSave}
          onPreview={handlePreview}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}