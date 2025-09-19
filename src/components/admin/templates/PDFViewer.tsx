import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { KnowledgeTemplate } from '@/types/template';

interface PDFViewerProps {
  template: KnowledgeTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PDFViewer = ({ template, isOpen, onClose }: PDFViewerProps) => {
  if (!template || !template.pdf_url) return null;

  const handleDownload = () => {
    window.open(template.pdf_url, '_blank');
  };

  const handleOpenInNewTab = () => {
    window.open(template.pdf_url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{template.title}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
            </div>
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}
        </DialogHeader>
        
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-muted/50">
          <iframe
            src={`${template.pdf_url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-none"
            title={`PDF Viewer - ${template.title}`}
          />
        </div>
        
        <div className="flex-shrink-0 text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>
              File: {template.pdf_filename} 
              {template.pdf_file_size && ` (${(template.pdf_file_size / 1024 / 1024).toFixed(1)} MB)`}
            </span>
            <span>
              Category: {template.category || 'General'} • 
              Created: {new Date(template.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};