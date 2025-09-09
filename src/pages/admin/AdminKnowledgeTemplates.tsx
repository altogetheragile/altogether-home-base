import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeTemplates, useDeleteKnowledgeTemplate, useCreateKnowledgeTemplate } from '@/hooks/useKnowledgeTemplates';
import { KnowledgeTemplate } from '@/types/template';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const TemplateTypeColors = {
  canvas: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  matrix: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  worksheet: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  process: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  form: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};

export default function AdminKnowledgeTemplates() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingTemplate, setViewingTemplate] = useState<KnowledgeTemplate | null>(null);
  
  const { data: templates, isLoading } = useKnowledgeTemplates();
  const deleteTemplate = useDeleteKnowledgeTemplate();
  const createTemplate = useCreateKnowledgeTemplate();

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || template.template_type === selectedType;
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = templates ? [...new Set(templates.map(t => t.category).filter(Boolean) as string[])] : [];

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/knowledge/templates/${id}/edit`);
  };

  const handleView = (template: KnowledgeTemplate) => {
    setViewingTemplate(template);
  };

  const handleCopy = async (template: KnowledgeTemplate) => {
    try {
      const copiedTemplate = {
        title: `${template.title} (Copy)`,
        description: template.description,
        template_type: template.template_type,
        category: template.category,
        configuration: template.config,
        is_public: false
      };
      
      await createTemplate.mutateAsync(copiedTemplate as any);
      toast.success(`Template "${template.title}" copied successfully`);
    } catch (error) {
      toast.error('Failed to copy template');
    }
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
            Create and manage templates for knowledge items
          </p>
        </div>
        
        <Button onClick={() => navigate('/admin/knowledge/templates/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
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
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="canvas">Canvas</SelectItem>
            <SelectItem value="matrix">Matrix</SelectItem>
            <SelectItem value="worksheet">Worksheet</SelectItem>
            <SelectItem value="process">Process</SelectItem>
            <SelectItem value="form">Form</SelectItem>
          </SelectContent>
        </Select>
        
        {categories.length > 0 && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Templates Grid */}
      {filteredTemplates?.length === 0 ? (
              <Button onClick={() => navigate('/admin/knowledge/templates/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates?.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onView={handleView}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
      
      {/* Template Preview Dialog */}
      <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Template Preview: {viewingTemplate?.title}
            </DialogTitle>
            <DialogDescription>
              Template configuration and details
            </DialogDescription>
          </DialogHeader>
          
          {viewingTemplate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {viewingTemplate.title}</div>
                    <div><strong>Type:</strong> {viewingTemplate.template_type}</div>
                    <div><strong>Category:</strong> {viewingTemplate.category || 'None'}</div>
                    <div><strong>Version:</strong> {viewingTemplate.version}</div>
                    <div><strong>Usage Count:</strong> {viewingTemplate.usage_count}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Public:</strong> {viewingTemplate.is_public ? 'Yes' : 'No'}</div>
                    <div><strong>Created:</strong> {new Date(viewingTemplate.created_at).toLocaleDateString()}</div>
                    <div><strong>Updated:</strong> {new Date(viewingTemplate.updated_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              
              {viewingTemplate.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{viewingTemplate.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Configuration</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(viewingTemplate.config, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateCardProps {
  template: KnowledgeTemplate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onView: (template: KnowledgeTemplate) => void;
  onCopy: (template: KnowledgeTemplate) => void;
}

function TemplateCard({ template, onDelete, onEdit, onView, onCopy }: TemplateCardProps) {
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
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Used {template.usage_count} times</span>
          <span>v{template.version}</span>
        </div>
        
        <div className="flex items-center gap-2">
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
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onCopy(template)}
          >
            <Copy className="w-4 h-4" />
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
        </div>
      </CardContent>
    </Card>
  );
}