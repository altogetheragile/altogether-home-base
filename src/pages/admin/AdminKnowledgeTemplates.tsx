import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Copy, Eye, FileText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeTemplates, useDeleteKnowledgeTemplate, useCreateKnowledgeTemplate } from '@/hooks/useKnowledgeTemplates';
import { KnowledgeTemplate } from '@/types/template';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PDFTemplateUpload } from '@/components/admin/templates/PDFTemplateUpload';
import { PDFViewer } from '@/components/admin/templates/PDFViewer';
import { usePDFTemplateOperations } from '@/hooks/usePDFTemplateOperations';

const TemplateTypeColors = {
  canvas: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  matrix: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  worksheet: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  process: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  form: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  pdf: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function AdminKnowledgeTemplates() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingTemplate, setViewingTemplate] = useState<KnowledgeTemplate | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  const { data: templates, isLoading } = useKnowledgeTemplates();
  const deleteTemplate = useDeleteKnowledgeTemplate();
  const createTemplate = useCreateKnowledgeTemplate();
  
  const {
    selectedTemplate: pdfTemplate,
    viewerOpen,
    openViewer,
    closeViewer,
    downloadTemplate,
    deleteTemplateWithConfirm
  } = usePDFTemplateOperations();

  const filteredTemplates = templates
    ?.filter((t) => t.pdf_url) // Filter by PDF URL instead of template_type
    ?.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

  const categories = templates ? [...new Set(templates.map(t => t.category).filter(Boolean) as string[])] : [];

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/knowledge/templates/${id}/edit`);
  };

  const handleView = (template: KnowledgeTemplate) => {
    if (template.template_type === 'pdf' && template.pdf_url) {
      openViewer(template);
    } else {
      setViewingTemplate(template);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Templates</h1>
          <p className="text-muted-foreground">
            Upload and manage PDF templates for knowledge items
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
                Upload a PDF template and link it to a knowledge item
              </DialogDescription>
            </DialogHeader>
            <PDFTemplateUpload onSuccess={handleUploadSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates?.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedType !== 'all' || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first template'
            }
          </p>
          {!searchTerm && selectedType === 'all' && selectedCategory === 'all' && (
            <Button onClick={() => navigate('/admin/knowledge/items')}>
              Go to Knowledge Items
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates?.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onView={handleView}
              onDownload={downloadTemplate}
              onDeletePDF={deleteTemplateWithConfirm}
            />
          ))}
        </div>
      )}
      
      {/* PDF Viewer for PDF templates */}
      <PDFViewer
        template={pdfTemplate}
        isOpen={viewerOpen}
        onClose={closeViewer}
      />
      
    </div>
  );
}

interface TemplateCardProps {
  template: KnowledgeTemplate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (template: KnowledgeTemplate) => void;
  onDownload: (template: KnowledgeTemplate) => void;
  onDeletePDF: (template: KnowledgeTemplate) => void;
}

function TemplateCard({ template, onDelete, onEdit, onView, onDownload, onDeletePDF }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{template.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={TemplateTypeColors[template.template_type]}>
                {template.template_type}
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
        
        {/* PDF specific info */}
        {template.template_type === 'pdf' && template.pdf_filename && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="truncate">{template.pdf_filename}</span>
            {template.pdf_file_size && (
              <span>({(template.pdf_file_size / 1024 / 1024).toFixed(1)} MB)</span>
            )}
          </div>
        )}
        
        {/* Tags for PDF templates */}
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
          {template.template_type === 'pdf' ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onView(template)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onDownload(template)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{template.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeletePDF(template)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onEdit(template.id)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onView(template)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{template.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(template.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}