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

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    background: '',
    source: '',
    category_id: '',
    planning_layer_id: '',
    domain_id: '',
    is_published: true,
    is_featured: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        category_id: '',
        planning_layer_id: '',
        domain_id: '',
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
              <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value || '' }))}>
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
              <Select value={formData.planning_layer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, planning_layer_id: value || '' }))}>
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
              <Select value={formData.domain_id} onValueChange={(value) => setFormData(prev => ({ ...prev, domain_id: value || '' }))}>
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