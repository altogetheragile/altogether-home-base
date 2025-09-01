import { useState, useEffect } from 'react';
import { 
  Info, FolderOpen, FileText, BookOpen, BarChart3, 
  Save, X, Eye, EyeOff, Star, StarOff 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { KnowledgeItemBasicInfo } from './editor/KnowledgeItemBasicInfo';
import { KnowledgeItemClassification } from './editor/KnowledgeItemClassification';
import { KnowledgeItemContent } from './editor/KnowledgeItemContent';
import { KnowledgeItemUseCases } from './editor/KnowledgeItemUseCases';
import { KnowledgeItemAnalytics } from './editor/KnowledgeItemAnalytics';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeItemEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: any;
  onSuccess: () => void;
}

export const KnowledgeItemEditor = ({
  open,
  onOpenChange,
  editingItem,
  onSuccess
}: KnowledgeItemEditorProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    background: '',
    source: '',
    category_id: '',
    planning_layer_id: '',
    domain_id: '',
    is_published: false,
    is_featured: false
  });

  const { toast } = useToast();
  const createKnowledgeItem = useCreateKnowledgeItem();
  const updateKnowledgeItem = useUpdateKnowledgeItem();

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        slug: editingItem.slug || '',
        description: editingItem.description || '',
        background: editingItem.background || '',
        source: editingItem.source || '',
        category_id: editingItem.category_id || '',
        planning_layer_id: editingItem.planning_layer_id || '',
        domain_id: editingItem.domain_id || '',
        is_published: editingItem.is_published || false,
        is_featured: editingItem.is_featured || false
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        background: '',
        source: '',
        category_id: '',
        planning_layer_id: '',
        domain_id: '',
        is_published: false,
        is_featured: false
      });
    }
    setActiveTab('basic');
  }, [editingItem, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      setActiveTab('basic');
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Validation Error", 
        description: "Slug is required",
        variant: "destructive",
      });
      setActiveTab('basic');
      return;
    }

    try {
      if (editingItem) {
        await updateKnowledgeItem.mutateAsync({
          id: editingItem.id,
          ...formData
        });
      } else {
        await createKnowledgeItem.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving knowledge item:', error);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return slug;
  };

  const handleNameChange = (name: string) => {
    handleFormChange('name', name);
    if (!editingItem || !formData.slug) {
      handleFormChange('slug', generateSlug(name));
    }
  };

  const isLoading = createKnowledgeItem.isPending || updateKnowledgeItem.isPending;

  const hasUnsavedChanges = editingItem ? (
    JSON.stringify(formData) !== JSON.stringify({
      name: editingItem.name || '',
      slug: editingItem.slug || '',
      description: editingItem.description || '',
      background: editingItem.background || '',
      source: editingItem.source || '',
      category_id: editingItem.category_id || '',
      planning_layer_id: editingItem.planning_layer_id || '',
      domain_id: editingItem.domain_id || '',
      is_published: editingItem.is_published || false,
      is_featured: editingItem.is_featured || false
    })
  ) : Object.values(formData).some(value => 
    typeof value === 'string' ? value.trim() !== '' : value !== false
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold">
                {editingItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {editingItem && (
                  <>
                    <span>ID: {editingItem.id}</span>
                    <Separator orientation="vertical" className="h-4" />
                  </>
                )}
                <span>Last saved: auto-save enabled</span>
                {hasUnsavedChanges && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="secondary" className="text-xs">
                      Unsaved changes
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingItem && (
                <div className="flex items-center gap-1">
                  <Badge variant={formData.is_published ? 'default' : 'secondary'}>
                    {formData.is_published ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </Badge>
                  {formData.is_featured && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                </div>
              )}

              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-1" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 flex flex-col"
            orientation="vertical"
          >
            <div className="flex flex-1 min-h-0">
              {/* Sidebar Tabs */}
              <div className="w-64 border-r border-border bg-muted/30">
                <TabsList className="flex flex-col h-full w-full bg-transparent p-2 space-y-1">
                  <TabsTrigger 
                    value="basic" 
                    className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="classification" 
                    className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Classification
                  </TabsTrigger>
                  <TabsTrigger 
                    value="content" 
                    className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Rich Content
                  </TabsTrigger>
                  <TabsTrigger 
                    value="usecases" 
                    className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Use Cases
                    {editingItem && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {editingItem.knowledge_use_cases?.length || 0}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {editingItem && (
                    <TabsTrigger 
                      value="analytics" 
                      className="w-full justify-start data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <TabsContent value="basic" className="h-full overflow-y-auto p-6 mt-0">
                  <KnowledgeItemBasicInfo
                    formData={formData}
                    onFormChange={handleFormChange}
                    onNameChange={handleNameChange}
                  />
                </TabsContent>

                <TabsContent value="classification" className="h-full overflow-y-auto p-6 mt-0">
                  <KnowledgeItemClassification
                    formData={formData}
                    onFormChange={handleFormChange}
                  />
                </TabsContent>

                <TabsContent value="content" className="h-full overflow-y-auto p-6 mt-0">
                  <KnowledgeItemContent
                    formData={formData}
                    onFormChange={handleFormChange}
                  />
                </TabsContent>

                <TabsContent value="usecases" className="h-full overflow-y-auto p-6 mt-0">
                  <KnowledgeItemUseCases
                    knowledgeItemId={editingItem?.id}
                  />
                </TabsContent>

                {editingItem && (
                  <TabsContent value="analytics" className="h-full overflow-y-auto p-6 mt-0">
                    <KnowledgeItemAnalytics
                      knowledgeItem={editingItem}
                    />
                  </TabsContent>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};