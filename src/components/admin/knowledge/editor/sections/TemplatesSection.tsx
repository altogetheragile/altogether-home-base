import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFormContext } from 'react-hook-form';
import { Plus, Palette, Eye, X, GripVertical, Upload } from 'lucide-react';
import { useState } from 'react';
import { TemplateSelectionDialog } from '../TemplateSelectionDialog';
import { TemplateUsageDialog } from '../TemplateUsageDialog';
import { PDFTemplateUpload } from '@/components/admin/templates/PDFTemplateUpload';
import { useKnowledgeItemTemplates, useRemoveTemplateAssociation } from '@/hooks/useKnowledgeItemTemplates';
import { toast } from 'sonner';
import type { KnowledgeTemplate } from '@/types/template';

interface TemplatesSectionProps {
  knowledgeItemId?: string;
}

export const TemplatesSection = ({ knowledgeItemId }: TemplatesSectionProps) => {
  const form = useFormContext();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<KnowledgeTemplate | null>(null);
  const [showUsageDialog, setShowUsageDialog] = useState(false);

  // Fetch associated templates
  const { data: associatedTemplates = [], refetch } = useKnowledgeItemTemplates(knowledgeItemId || '');
  const removeAssociation = useRemoveTemplateAssociation();

  const handleRemoveTemplate = async (associationId: string) => {
    try {
      await removeAssociation.mutateAsync(associationId);
      toast.success('Template removed successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to remove template');
    }
  };

  const handleUseTemplate = (template: KnowledgeTemplate) => {
    setSelectedTemplate(template);
    setShowUsageDialog(true);
  };

  const handleTemplateAdded = () => {
    refetch();
    setShowTemplateSelector(false);
  };

  const handleUploadSuccess = () => {
    refetch();
    setShowUploadDialog(false);
    toast.success('Template uploaded and linked successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Associated Templates
          </CardTitle>
          <CardDescription>
            Templates provide structured frameworks and tools for applying this knowledge item.
            Add templates to give users practical ways to implement these concepts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {associatedTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No templates associated</p>
              <p className="text-sm mb-4">
                Add templates to provide structured frameworks and tools for users
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setShowTemplateSelector(true)}
                  disabled={!knowledgeItemId}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Existing Template
                </Button>
                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  disabled={!knowledgeItemId}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Template
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {associatedTemplates.map((association) => (
                  <div
                    key={association.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{association.template?.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {association.template?.template_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {association.template?.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => association.template && handleUseTemplate(association.template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Use
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveTemplate(association.id)}
                        disabled={removeAssociation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTemplateSelector(true)}
                  disabled={!knowledgeItemId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Existing
                </Button>
                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  disabled={!knowledgeItemId}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Template Benefits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Template Benefits</CardTitle>
          <CardDescription>
            Why templates enhance learning and application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">For Learners</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Structured approach to implementation</li>
                <li>• Reduced cognitive load</li>
                <li>• Clear step-by-step guidance</li>
                <li>• Reusable frameworks</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">For Organizations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Consistent application methods</li>
                <li>• Faster knowledge transfer</li>
                <li>• Standardized outputs</li>
                <li>• Measurable results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Template Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload PDF Template</DialogTitle>
            <DialogDescription>
              Upload a PDF template that will be linked to this knowledge item
            </DialogDescription>
          </DialogHeader>
          {knowledgeItemId && (
            <PDFTemplateUpload 
              knowledgeItemId={knowledgeItemId}
              onSuccess={handleUploadSuccess} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <TemplateSelectionDialog
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        knowledgeItemId={knowledgeItemId || ''}
        onTemplateAdded={handleTemplateAdded}
      />

      {/* Template Usage Dialog */}
      {selectedTemplate && (
        <TemplateUsageDialog
          template={selectedTemplate}
          open={showUsageDialog}
          onOpenChange={setShowUsageDialog}
        />
      )}
    </div>
  );
};