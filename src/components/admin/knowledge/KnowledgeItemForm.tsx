import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningLayers } from '@/hooks/usePlanningLayers';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useKnowledgeItems, useCreateKnowledgeItem, useUpdateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { useKnowledgeUseCases, useCreateKnowledgeUseCase, useUpdateKnowledgeUseCase, useDeleteKnowledgeUseCase, type KnowledgeUseCase } from '@/hooks/useKnowledgeUseCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Plus, Trash2, Edit } from 'lucide-react';

interface KnowledgeItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: any;
  onSuccess: () => void;
}

const KnowledgeItemForm = ({ open, onOpenChange, editingItem, onSuccess }: KnowledgeItemFormProps) => {
  const { toast } = useToast();
  const { data: categories } = useKnowledgeCategories();
  const { data: planningLayers } = usePlanningLayers();
  const { data: domains } = useActivityDomains();
  const createKnowledgeItem = useCreateKnowledgeItem();
  const updateKnowledgeItem = useUpdateKnowledgeItem();
  
  // Use cases hooks
  const { data: useCases } = useKnowledgeUseCases(editingItem?.id || '');
  const createUseCase = useCreateKnowledgeUseCase();
  const updateUseCase = useUpdateKnowledgeUseCase();
  const deleteUseCase = useDeleteKnowledgeUseCase();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    background: '',
    source: '',
    category_id: undefined as string | undefined,
    planning_layer_id: undefined as string | undefined,
    domain_id: undefined as string | undefined,
    is_published: true,
    is_featured: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUseCases, setShowUseCases] = useState(false);
  const [editingUseCase, setEditingUseCase] = useState<KnowledgeUseCase | null>(null);
  const [newUseCase, setNewUseCase] = useState<Partial<KnowledgeUseCase>>({
    case_type: 'generic',
    title: '',
    what: '',
    who: '',
    when_used: '',
    where_used: '',
    why: '',
    how: '',
    how_much: '',
    summary: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        slug: editingItem.slug || '',
        description: editingItem.description || '',
        background: editingItem.background || '',
        source: editingItem.source || '',
        category_id: editingItem.category_id || undefined,
        planning_layer_id: editingItem.planning_layer_id || undefined,
        domain_id: editingItem.domain_id || undefined,
        is_published: editingItem.is_published ?? true,
        is_featured: editingItem.is_featured ?? false,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        background: '',
        source: '',
        category_id: undefined,
        planning_layer_id: undefined,
        domain_id: undefined,
        is_published: true,
        is_featured: false,
      });
    }
  }, [editingItem, open]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug || generateSlug(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    if (!formData.slug.trim()) {
      toast({ title: "Error", description: "Slug is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
        planning_layer_id: formData.planning_layer_id || null,
        domain_id: formData.domain_id || null,
      };

      if (editingItem) {
        await updateKnowledgeItem.mutateAsync({
          id: editingItem.id,
          ...submitData,
        });
      } else {
        await createKnowledgeItem.mutateAsync(submitData);
      }
      
      onSuccess();
    } catch (error) {
      // Error handling is done in the hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUseCase = async () => {
    if (!editingItem?.id || !newUseCase.case_type) return;
    
    try {
      await createUseCase.mutateAsync({
        ...newUseCase,
        knowledge_item_id: editingItem.id,
      } as Omit<KnowledgeUseCase, 'id' | 'created_at' | 'updated_at'>);
      
      setNewUseCase({
        case_type: 'generic',
        title: '',
        what: '',
        who: '',
        when_used: '',
        where_used: '',
        why: '',
        how: '',
        how_much: '',
        summary: '',
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleUpdateUseCase = async (useCase: KnowledgeUseCase) => {
    try {
      await updateUseCase.mutateAsync(useCase);
      setEditingUseCase(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteUseCase = async (useCaseId: string) => {
    if (!editingItem?.id || !confirm('Are you sure you want to delete this use case?')) return;
    
    try {
      await deleteUseCase.mutateAsync({
        id: useCaseId,
        knowledgeItemId: editingItem.id,
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter knowledge item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="url-friendly-name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the knowledge item"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Background Information</Label>
            <RichTextEditor
              content={formData.background}
              onChange={(content) => setFormData(prev => ({ ...prev, background: content }))}
              placeholder="Detailed background information about this knowledge item..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === "" ? undefined : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planning_layer">Planning Layer</Label>
              <Select value={formData.planning_layer_id || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, planning_layer_id: value === "" ? undefined : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select planning layer" />
                </SelectTrigger>
                <SelectContent>
                  {planningLayers?.map((layer) => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Activity Domain</Label>
              <Select value={formData.domain_id || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, domain_id: value === "" ? undefined : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains?.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              placeholder="Source or reference for this knowledge item"
            />
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="is_featured">Featured</Label>
            </div>
          </div>

          {/* Use Cases Section */}
          {editingItem && (
            <Card>
              <Collapsible open={showUseCases} onOpenChange={setShowUseCases}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <CardTitle className="flex items-center justify-between text-lg">
                      Use Cases ({useCases?.length || 0})
                      <ChevronDown className={`h-4 w-4 transition-transform ${showUseCases ? 'rotate-180' : ''}`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Existing Use Cases */}
                    {useCases?.map((useCase) => (
                      <Card key={useCase.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              useCase.case_type === 'generic' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {useCase.case_type}
                            </span>
                            {useCase.title && <span className="font-medium">{useCase.title}</span>}
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUseCase(useCase)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUseCase(useCase.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {useCase.what && <div><strong>What:</strong> {useCase.what}</div>}
                          {useCase.who && <div><strong>Who:</strong> {useCase.who}</div>}
                          {useCase.when_used && <div><strong>When:</strong> {useCase.when_used}</div>}
                          {useCase.where_used && <div><strong>Where:</strong> {useCase.where_used}</div>}
                          {useCase.why && <div><strong>Why:</strong> {useCase.why}</div>}
                          {useCase.how && <div><strong>How:</strong> {useCase.how}</div>}
                        </div>
                        {useCase.summary && (
                          <div className="mt-2 text-sm">
                            <strong>Summary:</strong> {useCase.summary}
                          </div>
                        )}
                      </Card>
                    ))}

                    {/* Add New Use Case Form */}
                    <Card className="p-4 border-dashed">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Add New Use Case</h4>
                          <Select 
                            value={newUseCase.case_type} 
                            onValueChange={(value: 'generic' | 'example') => 
                              setNewUseCase(prev => ({ ...prev, case_type: value }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="generic">Generic</SelectItem>
                              <SelectItem value="example">Example</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={newUseCase.title || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Use case title"
                            />
                          </div>
                          <div>
                            <Label>What</Label>
                            <Input
                              value={newUseCase.what || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, what: e.target.value }))}
                              placeholder="What is being done"
                            />
                          </div>
                          <div>
                            <Label>Who</Label>
                            <Input
                              value={newUseCase.who || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, who: e.target.value }))}
                              placeholder="Who uses this"
                            />
                          </div>
                          <div>
                            <Label>When</Label>
                            <Input
                              value={newUseCase.when_used || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, when_used: e.target.value }))}
                              placeholder="When to use"
                            />
                          </div>
                          <div>
                            <Label>Where</Label>
                            <Input
                              value={newUseCase.where_used || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, where_used: e.target.value }))}
                              placeholder="Where to use"
                            />
                          </div>
                          <div>
                            <Label>Why</Label>
                            <Input
                              value={newUseCase.why || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, why: e.target.value }))}
                              placeholder="Why use this"
                            />
                          </div>
                          <div>
                            <Label>How</Label>
                            <Input
                              value={newUseCase.how || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, how: e.target.value }))}
                              placeholder="How to use"
                            />
                          </div>
                          <div>
                            <Label>How Much</Label>
                            <Input
                              value={newUseCase.how_much || ''}
                              onChange={(e) => setNewUseCase(prev => ({ ...prev, how_much: e.target.value }))}
                              placeholder="Effort/cost/time"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Summary</Label>
                          <Textarea
                            value={newUseCase.summary || ''}
                            onChange={(e) => setNewUseCase(prev => ({ ...prev, summary: e.target.value }))}
                            placeholder="Brief summary of this use case"
                            rows={3}
                          />
                        </div>
                        
                        <Button 
                          type="button" 
                          onClick={handleAddUseCase}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Use Case
                        </Button>
                      </div>
                    </Card>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeItemForm;