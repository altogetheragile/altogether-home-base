import { useState } from 'react';
import { Plus, FileText, Download, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useKnowledgeItemTemplates, useRemoveTemplateAssociation } from '@/hooks/useKnowledgeItemTemplates';
import { TemplateAssetUpload } from '@/components/admin/templates/TemplateAssetUpload';
import { PDFViewer } from '@/components/admin/templates/PDFViewer';
import { usePDFTemplateOperations } from '@/hooks/usePDFTemplateOperations';
import { toast } from 'sonner';

interface TemplateManagerProps {
  knowledgeItemId: string;
}

export const TemplateManager = ({ knowledgeItemId }: TemplateManagerProps) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { data: associations = [] } = useKnowledgeItemTemplates(knowledgeItemId);
  const removeAssociation = useRemoveTemplateAssociation();
  
  const {
    selectedTemplate,
    viewerOpen,
    openViewer,
    closeViewer,
    downloadTemplate
  } = usePDFTemplateOperations();

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
    toast.success('Template uploaded and linked successfully');
  };

  const handleRemoveTemplate = async (associationId: string) => {
    try {
      await removeAssociation.mutateAsync(associationId);
    } catch (error) {
      console.error('Error removing template:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload and manage templates for this knowledge item
          </p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Upload PDF Template</DialogTitle>
              <DialogDescription>
                Upload a PDF template that will be linked to this knowledge item
              </DialogDescription>
            </DialogHeader>
            <TemplateAssetUpload onSuccess={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {associations.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h4 className="text-lg font-medium mb-2">No templates linked</h4>
          <p className="text-muted-foreground mb-4">
            Upload templates to provide practical tools for this knowledge item
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {associations.map((association) => {
            const template = association.template;
            if (!template) return null;
            
            return (
              <Card key={association.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{template.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-red-100 text-red-800">
                          {template.template_type?.toUpperCase()}
                        </Badge>
                        {template.category && (
                          <Badge variant="outline">{template.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  {(template.pdf_filename || template.file_filename) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{template.pdf_filename || template.file_filename}</span>
                      {(template.pdf_file_size || template.file_size) && (
                        <span>({((template.pdf_file_size || template.file_size || 0) / 1024 / 1024).toFixed(1)} MB)</span>
                      )}
                    </div>
                  )}
                  
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Used {template.usage_count} times</span>
                    <span>v{template.version}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openViewer(template)}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadTemplate(template)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Template</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{template.title}" from this knowledge item? The template will not be deleted, just unlinked.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveTemplate(association.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PDFViewer
        template={selectedTemplate}
        isOpen={viewerOpen}
        onClose={closeViewer}
      />
    </div>
  );
};