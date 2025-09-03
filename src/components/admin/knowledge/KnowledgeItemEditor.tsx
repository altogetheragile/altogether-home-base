import { useState, useEffect, useRef } from 'react';
import { 
  Info, FolderOpen, FileText, BookOpen, BarChart3, 
  Save, X, Eye, EyeOff, Star, StarOff, Tag, Target
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
import { KnowledgeItemEnhancedFields } from './editor/KnowledgeItemEnhancedFields';
import { UseCaseForm } from './editor/UseCaseForm';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useKnowledgeMediaMutations } from '@/hooks/useKnowledgeMediaMutations';
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
  const [showUseCaseForm, setShowUseCaseForm] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    background: '',
    source: '',
    author: '',
    reference_url: '',
    publication_year: '',
    common_pitfalls: [] as string[],
    evidence_sources: [] as string[],
    related_techniques: [] as string[],
    learning_value_summary: '',
    key_terminology: {} as Record<string, string>,
    category_id: '',
    planning_layer_id: '',
    domain_id: '',
    is_published: false,
    is_featured: false,
    mediaItems: []
  });

  const { toast } = useToast();
  const createKnowledgeItem = useCreateKnowledgeItem();
  const updateKnowledgeItem = useUpdateKnowledgeItem();
  const { updateTechniqueMedia } = useKnowledgeMediaMutations();

  const prevOpenRef = useRef<boolean>(open);
  const prevEditingItemRef = useRef<typeof editingItem | null>(editingItem);

  useEffect(() => {
    const isOpening = !prevOpenRef.current && open;
    const editingItemChanged =
      prevEditingItemRef.current?.id !== editingItem?.id;

    // Only reset the tab when the dialog opens for the first time or a new item is selected
    if (isOpening || editingItemChanged) {
      setActiveTab('basic');
    }

    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        slug: editingItem.slug || '',
        description: editingItem.description || '',
        background: editingItem.background || '',
        source: editingItem.source || '',
        author: editingItem.author || '',
        reference_url: editingItem.reference_url || '',
        publication_year: editingItem.publication_year?.toString() || '',
        common_pitfalls: editingItem.common_pitfalls || [],
        evidence_sources: editingItem.evidence_sources || [],
        related_techniques: editingItem.related_techniques || [],
        learning_value_summary: editingItem.learning_value_summary || '',
        key_terminology: editingItem.key_terminology || {},
        category_id: editingItem.category_id || '',
        planning_layer_id: editingItem.planning_layer_id || '',
        domain_id: editingItem.domain_id || '',
        is_published: editingItem.is_published || false,
        is_featured: editingItem.is_featured || false,
        mediaItems: editingItem.media || []
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        background: '',
        source: '',
        author: '',
        reference_url: '',
        publication_year: '',
        common_pitfalls: [],
        evidence_sources: [],
        related_techniques: [],
        learning_value_summary: '',
        key_terminology: {},
        category_id: '',
        planning_layer_id: '',
        domain_id: '',
        is_published: false,
        is_featured: false,
        mediaItems: []
      });
    }

    // Update refs for next render
    prevOpenRef.current = open;
    prevEditingItemRef.current = editingItem;
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
      const { mediaItems, ...itemData } = formData;
      
      // Convert publication_year to number if it exists
      const sanitizedData = {
        ...itemData,
        publication_year: itemData.publication_year ? parseInt(itemData.publication_year) : null
      };
      
      let savedItem;
      
      if (editingItem) {
        savedItem = await updateKnowledgeItem.mutateAsync({
          id: editingItem.id,
          ...sanitizedData
        });
      } else {
        savedItem = await createKnowledgeItem.mutateAsync(sanitizedData);
      }
      
      // Save media items if any
      if (mediaItems && mediaItems.length > 0) {
        const itemId = editingItem?.id || savedItem.id;
        if (itemId) {
          await updateTechniqueMedia.mutateAsync({
            techniqueId: itemId,
            mediaItems: mediaItems
          });
        }
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

  const handleAddUseCase = (type: 'generic' | 'example') => {
    setEditingUseCase({ case_type: type });
    setShowUseCaseForm(true);
  };

  const handleEditUseCase = (useCase: any) => {
    setEditingUseCase(useCase);
    setShowUseCaseForm(true);
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
      is_featured: editingItem.is_featured || false,
      mediaItems: editingItem.media || []
    })
  ) : Object.values(formData).some(value => 
    typeof value === 'string' ? value.trim() !== '' : 
    Array.isArray(value) ? value.length > 0 : 
    value !== false
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b border-border">
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
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 flex flex-col"
          >
            {/* Horizontal Tabs */}
            <div className="border-b border-border bg-muted/30">
              <TabsList className="h-12 w-full justify-start bg-transparent px-8 rounded-none">
                <TabsTrigger 
                  value="basic" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger 
                  value="classification" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Classification
                </TabsTrigger>
                <TabsTrigger 
                  value="content" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Rich Content
                </TabsTrigger>
                 <TabsTrigger 
                   value="enhanced" 
                   className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                 >
                   <Star className="h-4 w-4 mr-2" />
                   Enhanced
                 </TabsTrigger>
                 <TabsTrigger 
                   value="usecases" 
                   className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                 >
                   <Target className="h-4 w-4 mr-2" />
                   Use Cases
                   {editingItem && (
                     <Badge variant="secondary" className="ml-2 text-xs">
                       {editingItem.knowledge_use_cases?.length || 0}
                     </Badge>
                   )}
                 </TabsTrigger>
                {editingItem && (
                  <TabsTrigger 
                    value="analytics" 
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="basic" className="h-full overflow-y-auto p-8 mt-0">
                <KnowledgeItemBasicInfo
                  formData={formData}
                  onFormChange={handleFormChange}
                  onNameChange={handleNameChange}
                />
              </TabsContent>

              <TabsContent value="classification" className="h-full overflow-y-auto p-8 mt-0">
                <KnowledgeItemClassification
                  formData={formData}
                  onFormChange={handleFormChange}
                />
              </TabsContent>

              <TabsContent value="content" className="h-full overflow-y-auto p-8 mt-0">
                <KnowledgeItemContent
                  formData={formData}
                  onFormChange={handleFormChange}
                />
              </TabsContent>

              <TabsContent value="enhanced" className="h-full overflow-y-auto p-8 mt-0">
                <KnowledgeItemEnhancedFields
                  formData={formData}
                  onFormChange={handleFormChange}
                />
              </TabsContent>

              <TabsContent value="usecases" className="h-full overflow-y-auto p-8 mt-0">
                <KnowledgeItemUseCases
                  knowledgeItemId={editingItem?.id}
                  onSaveItem={!editingItem ? handleSave : undefined}
                  onAddUseCase={handleAddUseCase}
                  onEditUseCase={handleEditUseCase}
                />
              </TabsContent>

              {editingItem && (
                <TabsContent value="analytics" className="h-full overflow-y-auto p-8 mt-0">
                  <KnowledgeItemAnalytics
                    knowledgeItem={editingItem}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

    {/* Use Case Form - rendered as sibling to main dialog */}
    <UseCaseForm
      open={showUseCaseForm}
      onOpenChange={setShowUseCaseForm}
      knowledgeItemId={editingItem?.id}
      editingUseCase={editingUseCase}
      onSuccess={() => {
        setShowUseCaseForm(false);
        setEditingUseCase(null);
      }}
    />
    </>
  );
};