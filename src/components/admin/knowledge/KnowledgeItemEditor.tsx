import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateKnowledgeItem, useUpdateKnowledgeItem, type KnowledgeItem } from '@/hooks/useKnowledgeItems';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { usePlanningLayers } from '@/hooks/usePlanningLayers';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  slug: string;
  description: string;
  background: string;
  source: string;
  author: string;
  reference_url: string;
  publication_year: number | undefined;
  category_id: string;
  planning_layer_id: string;
  domain_id: string;
  learning_value_summary: string;
  is_published: boolean;
  is_featured: boolean;
}

export type KnowledgeItemEditorProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  knowledgeItem: KnowledgeItem | null;
  onSuccess: () => void;
};

export function KnowledgeItemEditor({
  open,
  onOpenChange,
  knowledgeItem,
  onSuccess,
}: KnowledgeItemEditorProps) {
  const { toast } = useToast();
  const { data: categories } = useKnowledgeCategories();
  const { data: planningLayers } = usePlanningLayers();
  const { data: domains } = useActivityDomains();
  
  const createMutation = useCreateKnowledgeItem();
  const updateMutation = useUpdateKnowledgeItem();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    background: '',
    source: '',
    author: '',
    reference_url: '',
    publication_year: undefined,
    category_id: '',
    planning_layer_id: '',
    domain_id: '',
    learning_value_summary: '',
    is_published: false,
    is_featured: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (knowledgeItem && open) {
      // Populate form with existing data
      setFormData({
        name: knowledgeItem.name || '',
        slug: knowledgeItem.slug || '',
        description: knowledgeItem.description || '',
        background: knowledgeItem.background || '',
        source: knowledgeItem.source || '',
        author: knowledgeItem.author || '',
        reference_url: knowledgeItem.reference_url || '',
        publication_year: knowledgeItem.publication_year || undefined,
        category_id: knowledgeItem.category_id || '',
        planning_layer_id: knowledgeItem.planning_layer_id || '',
        domain_id: knowledgeItem.domain_id || '',
        learning_value_summary: knowledgeItem.learning_value_summary || '',
        is_published: knowledgeItem.is_published ?? false,
        is_featured: knowledgeItem.is_featured ?? false,
      });
    } else if (open && !knowledgeItem) {
      // Reset form for new item
      setFormData({
        name: '',
        slug: '',
        description: '',
        background: '',
        source: '',
        author: '',
        reference_url: '',
        publication_year: undefined,
        category_id: '',
        planning_layer_id: '',
        domain_id: '',
        learning_value_summary: '',
        is_published: false,
        is_featured: false,
      });
    }
    setErrors({});
  }, [knowledgeItem, open]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(value) : prev.slug
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }
    
    if (formData.reference_url && formData.reference_url.trim()) {
      try {
        new URL(formData.reference_url);
      } catch {
        newErrors.reference_url = 'Invalid URL';
      }
    }
    
    if (formData.publication_year && (formData.publication_year < 1900 || formData.publication_year > 2030)) {
      newErrors.publication_year = 'Publication year must be between 1900 and 2030';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data for submission - remove empty strings
      const submitData = {
        ...formData,
        description: formData.description || undefined,
        background: formData.background || undefined,
        source: formData.source || undefined,
        author: formData.author || undefined,
        reference_url: formData.reference_url || undefined,
        category_id: formData.category_id || undefined,
        planning_layer_id: formData.planning_layer_id || undefined,
        domain_id: formData.domain_id || undefined,
        learning_value_summary: formData.learning_value_summary || undefined,
      };

      if (knowledgeItem?.id) {
        // For updates, pass id along with the data
        await updateMutation.mutateAsync({
          id: knowledgeItem.id,
          ...submitData,
        });
      } else {
        // For creates, just pass the data
        await createMutation.mutateAsync(submitData);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutations themselves
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {knowledgeItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter knowledge item name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="knowledge-item-slug"
                className={errors.slug ? 'border-red-500' : ''}
              />
              {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the knowledge item"
              />
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Classification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
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

              <div>
                <Label>Planning Layer</Label>
                <Select
                  value={formData.planning_layer_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, planning_layer_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select layer" />
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

              <div>
                <Label>Domain</Label>
                <Select
                  value={formData.domain_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, domain_id: value }))}
                >
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
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Content</h3>
            
            <div>
              <Label htmlFor="background">Background</Label>
              <Textarea
                id="background"
                value={formData.background}
                onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                placeholder="Background information about this knowledge item"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Textarea
                id="source"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Source information"
              />
            </div>

            <div>
              <Label htmlFor="learning_value_summary">Learning Value Summary</Label>
              <Textarea
                id="learning_value_summary"
                value={formData.learning_value_summary}
                onChange={(e) => setFormData(prev => ({ ...prev, learning_value_summary: e.target.value }))}
                placeholder="Summary of the learning value"
              />
            </div>
          </div>

          {/* Author Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Author Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>

              <div>
                <Label htmlFor="reference_url">Reference URL</Label>
                <Input
                  id="reference_url"
                  type="url"
                  value={formData.reference_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_url: e.target.value }))}
                  placeholder="https://example.com"
                  className={errors.reference_url ? 'border-red-500' : ''}
                />
                {errors.reference_url && <p className="text-sm text-red-500 mt-1">{errors.reference_url}</p>}
              </div>

              <div>
                <Label htmlFor="publication_year">Publication Year</Label>
                <Input
                  id="publication_year"
                  type="number"
                  value={formData.publication_year || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    publication_year: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="2024"
                  className={errors.publication_year ? 'border-red-500' : ''}
                />
                {errors.publication_year && <p className="text-sm text-red-500 mt-1">{errors.publication_year}</p>}
              </div>
            </div>
          </div>

          {/* Publication Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Publication Settings</h3>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label>Published</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label>Featured</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 
               knowledgeItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}