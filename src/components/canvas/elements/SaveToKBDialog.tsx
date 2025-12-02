import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useKnowledgeCategories } from '@/hooks/useKnowledgeCategories';
import { useActivityDomains } from '@/hooks/useActivityDomains';
import { usePlanningFocuses } from '@/hooks/usePlanningFocuses';
import { useCreateKnowledgeItem } from '@/hooks/useKnowledgeItems';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SaveToKBDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    label: string;
    color?: string;
    icon?: string;
    emoji?: string;
    notes?: string;
  };
  onSaveComplete?: (knowledgeItemId: string) => void;
}

export const SaveToKBDialog: React.FC<SaveToKBDialogProps> = ({
  isOpen,
  onClose,
  data,
  onSaveComplete,
}) => {
  const [name, setName] = useState(data.label || '');
  const [description, setDescription] = useState(data.notes || '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [domainId, setDomainId] = useState<string>('');
  const [planningFocusId, setPlanningFocusId] = useState<string>('');
  const [isPublished, setIsPublished] = useState(false);

  const { data: categories, isLoading: loadingCategories } = useKnowledgeCategories();
  const { data: domains, isLoading: loadingDomains } = useActivityDomains();
  const { data: planningFocuses, isLoading: loadingFocuses } = usePlanningFocuses();
  const createKnowledgeItem = useCreateKnowledgeItem();

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const slug = generateSlug(name) + '-' + Date.now().toString(36);
      
      const result = await createKnowledgeItem.mutateAsync({
        name: name.trim(),
        slug,
        description: description.trim() || null,
        category_id: categoryId || null,
        domain_id: domainId || null,
        planning_focus_id: planningFocusId || null,
        is_published: isPublished,
        is_featured: false,
      });

      toast.success('Knowledge Item created successfully!', {
        action: {
          label: 'View in KB',
          onClick: () => window.open(`/knowledge/${result.slug}`, '_blank'),
        },
      });

      onSaveComplete?.(result.id);
      onClose();
    } catch (error) {
      console.error('Error creating knowledge item:', error);
      toast.error('Failed to create Knowledge Item');
    }
  };

  const isLoading = loadingCategories || loadingDomains || loadingFocuses;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Knowledge Base</DialogTitle>
          <DialogDescription>
            Save this custom hexi as a reusable Knowledge Item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Activity Domain</Label>
            <Select value={domainId} onValueChange={setDomainId}>
              <SelectTrigger>
                <SelectValue placeholder="Select domain..." />
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

          <div className="space-y-2">
            <Label htmlFor="focus">Planning Focus</Label>
            <Select value={planningFocusId} onValueChange={setPlanningFocusId}>
              <SelectTrigger>
                <SelectValue placeholder="Select planning focus..." />
              </SelectTrigger>
              <SelectContent>
                {planningFocuses?.map((focus) => (
                  <SelectItem key={focus.id} value={focus.id}>
                    {focus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="published">Publish immediately</Label>
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={createKnowledgeItem.isPending || isLoading}
          >
            {createKnowledgeItem.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save to KB'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};