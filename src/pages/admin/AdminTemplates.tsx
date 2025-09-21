import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Download, Trash2, Edit } from 'lucide-react';
import { useKnowledgeTemplates } from '@/hooks/useKnowledgeTemplates';
import SearchAndFilter from '@/components/admin/SearchAndFilter';
import BulkOperations from '@/components/admin/BulkOperations';
import { TemplateAssetUpload } from '@/components/admin/templates/TemplateAssetUpload';
import { PDFViewer } from '@/components/admin/templates/PDFViewer';
import { usePDFTemplateOperations } from '@/hooks/usePDFTemplateOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeTemplateMutations } from '@/hooks/useKnowledgeTemplateMutations';
import { toast } from 'sonner';

const AdminTemplates = () => {
  const { data: templates = [], isLoading, error } = useKnowledgeTemplates();
  const {
    selectedTemplate,
    viewerOpen,
    openViewer,
    closeViewer,
    downloadTemplate,
    deleteTemplateWithConfirm
  } = usePDFTemplateOperations();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pdf' | 'canvas' | 'matrix' | 'worksheet' | 'process' | 'form'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      if (filter === 'all') return true;
      return template.template_type === filter;
    })
    .filter(template => 
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleUploadSuccess = () => {
    setShowUploadDialog(false);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">PDF Templates</h1>
        </div>
        <div className="text-center py-8">Loading templates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">PDF Templates</h1>
        </div>
        <div className="text-center py-8 text-red-500">
          Error loading templates. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PDF Templates</h1>
          <p className="text-muted-foreground mt-2">
            Templates are now managed directly within Knowledge Items. Visit a specific knowledge item to upload and manage its templates.
          </p>
        </div>
        <Button onClick={() => window.location.href = '/admin/knowledge/items'}>
          Go to Knowledge Items
        </Button>
      </div>

      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearFilters={() => {
          setSearchTerm('');
          setFilter('all');
          setSortBy('newest');
        }}
        filters={[
          {
            label: 'Type',
            value: filter,
            options: [
               { value: 'all', label: 'All Templates' },
               { value: 'pdf', label: 'PDF Templates' }
            ],
            onChange: (value: string) => setFilter(value as typeof filter)
          },
          {
            label: 'Sort',
            value: sortBy,
            options: [
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'alphabetical', label: 'A-Z' }
            ],
            onChange: (value: string) => setSortBy(value as typeof sortBy)
          }
        ]}
      />

      {selectedItems.length > 0 && (
        <BulkOperations
          selectedItems={selectedItems}
          allItems={filteredTemplates}
          onSelectAll={(checked: boolean) => {
            if (checked) {
              setSelectedItems(filteredTemplates.map(t => t.id));
            } else {
              setSelectedItems([]);
            }
          }}
          type="templates"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(template.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems([...selectedItems, template.id]);
                    } else {
                      setSelectedItems(selectedItems.filter(id => id !== template.id));
                    }
                  }}
                  className="ml-2"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge 
                  variant={(template.pdf_url || template.file_url) ? 'destructive' : 'secondary'}
                >
                  {template.template_type?.toUpperCase()}
                </Badge>
                {template.category && (
                  <Badge variant="outline">{template.category}</Badge>
                )}
                {template.usage_count > 0 && (
                  <Badge variant="secondary">{template.usage_count} uses</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.description}
                </p>
              )}

              {template.pdf_filename && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{template.pdf_filename}</span>
                  {template.pdf_file_size && (
                    <span>({formatFileSize(template.pdf_file_size)})</span>
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

              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openViewer(template)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadTemplate(template)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTemplateWithConfirm(template)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <span className="text-xs text-muted-foreground">
                  {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by uploading your first PDF template'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <Button onClick={() => window.location.href = '/admin/knowledge/items'}>
              <Plus className="h-4 w-4 mr-2" />
              Go to Knowledge Items
            </Button>
          )}
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

export default AdminTemplates;