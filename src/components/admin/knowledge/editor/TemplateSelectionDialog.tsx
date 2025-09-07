import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Palette, Users, Clock, Filter } from 'lucide-react';
import { useKnowledgeTemplates, useKnowledgeTemplatesByType } from '@/hooks/useKnowledgeTemplates';
import { useAssociateTemplate } from '@/hooks/useKnowledgeItemTemplates';
import { toast } from 'sonner';
import type { KnowledgeTemplate, TemplateType } from '@/types/template';

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledgeItemId: string;
  onTemplateAdded?: () => void;
}

const templateTypeLabels: Record<TemplateType, string> = {
  canvas: 'Canvas',
  matrix: 'Matrix',
  worksheet: 'Worksheet',
  process: 'Process',
  form: 'Form'
};

const templateTypeColors: Record<TemplateType, string> = {
  canvas: 'bg-blue-100 text-blue-800',
  matrix: 'bg-green-100 text-green-800',
  worksheet: 'bg-purple-100 text-purple-800',
  process: 'bg-orange-100 text-orange-800',
  form: 'bg-pink-100 text-pink-800'
};

export const TemplateSelectionDialog = ({ 
  open, 
  onOpenChange, 
  knowledgeItemId, 
  onTemplateAdded 
}: TemplateSelectionDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TemplateType | 'all'>('all');
  
  const { data: allTemplates = [] } = useKnowledgeTemplates();
  const associateTemplate = useAssociateTemplate();

  // Filter templates based on search and type
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || template.template_type === selectedType;
    return matchesSearch && matchesType;
  });

  // Group templates by type for better organization
  const templatesByType = filteredTemplates.reduce((acc, template) => {
    const type = template.template_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {} as Record<TemplateType, KnowledgeTemplate[]>);

  const handleAssociateTemplate = async (template: KnowledgeTemplate) => {
    try {
      await associateTemplate.mutateAsync({
        knowledgeItemId,
        templateId: template.id,
        displayOrder: 0
      });
      toast.success(`Template "${template.title}" added successfully`);
      onTemplateAdded?.();
    } catch (error) {
      toast.error('Failed to add template');
    }
  };

  const TemplateCard = ({ template }: { template: KnowledgeTemplate }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={templateTypeColors[template.template_type]}>
                {templateTypeLabels[template.template_type]}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {template.usage_count} uses
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleAssociateTemplate(template)}
            disabled={associateTemplate.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      {template.description && (
        <CardContent className="pt-0">
          <CardDescription>{template.description}</CardDescription>
        </CardContent>
      )}
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Add Template
          </DialogTitle>
          <DialogDescription>
            Choose templates that complement this knowledge item and provide practical frameworks for implementation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TemplateType | 'all')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(templateTypeLabels).map(([type, label]) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No templates found</p>
                <p className="text-sm">
                  {searchQuery || selectedType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first template to get started'
                  }
                </p>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All ({filteredTemplates.length})</TabsTrigger>
                  {Object.entries(templatesByType).map(([type, templates]) => (
                    <TabsTrigger key={type} value={type}>
                      {templateTypeLabels[type as TemplateType]} ({templates.length})
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </TabsContent>
                
                {Object.entries(templatesByType).map(([type, templates]) => (
                  <TabsContent key={type} value={type} className="space-y-4">
                    {templates.map((template) => (
                      <TemplateCard key={template.id} template={template} />
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              // Navigate to create template page
              window.open('/admin/knowledge/templates/new', '_blank');
            }}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};