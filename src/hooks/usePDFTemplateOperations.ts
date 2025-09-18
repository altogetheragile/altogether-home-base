import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useKnowledgeTemplateMutations } from './useKnowledgeTemplateMutations';
import { toast } from 'sonner';
import { KnowledgeTemplate } from '@/types/template';

export const usePDFTemplateOperations = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<KnowledgeTemplate | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { deleteTemplate } = useKnowledgeTemplateMutations();

  const openViewer = (template: KnowledgeTemplate) => {
    setSelectedTemplate(template);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedTemplate(null);
  };

  const downloadTemplate = async (template: KnowledgeTemplate) => {
    if (template.pdf_url) {
      // Increment usage count
      try {
        await supabase
          .rpc('increment_pdf_template_usage', { template_uuid: template.id });
        
        // Open download
        const link = document.createElement('a');
        link.href = template.pdf_url!;
        link.download = template.pdf_filename || `${template.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Template downloaded successfully');
      } catch (error) {
        console.error('Error tracking usage:', error);
        // Still allow download even if tracking fails
        window.open(template.pdf_url, '_blank');
      }
    }
  };

  const deleteTemplateWithConfirm = async (template: KnowledgeTemplate) => {
    const confirmMessage = `Are you sure you want to delete "${template.title}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Delete PDF file from storage if it exists
        if (template.pdf_url) {
          const fileName = template.pdf_url.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from('pdf-templates')
              .remove([fileName]);
          }
        }

        // Delete template record
        await deleteTemplate.mutateAsync(template.id);
        toast.success('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  const copyTemplateLink = (template: KnowledgeTemplate) => {
    if (template.pdf_url) {
      navigator.clipboard.writeText(template.pdf_url)
        .then(() => toast.success('Template link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  return {
    selectedTemplate,
    viewerOpen,
    openViewer,
    closeViewer,
    downloadTemplate,
    deleteTemplateWithConfirm,
    copyTemplateLink
  };
};