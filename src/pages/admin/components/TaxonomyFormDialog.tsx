import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TaxonomyItem, TaxonomyType, TaxonomyFormData, TabConfig } from './taxonomy-types';

interface TaxonomyFormDialogProps {
  editingItem: TaxonomyItem | null;
  formData: TaxonomyFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaxonomyFormData>>;
  tabConfig: TabConfig;
  activeTab: TaxonomyType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

const TaxonomyFormDialog = ({
  editingItem,
  formData,
  setFormData,
  tabConfig,
  activeTab,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: TaxonomyFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? `Edit ${tabConfig.label.slice(0, -1)}` : `Create ${tabConfig.label.slice(0, -1)}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="url-friendly-name"
              required
            />
          </div>
          {tabConfig.hasColor && (
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          )}
          {tabConfig.hasOrder && (
            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          )}
          {activeTab !== 'tags' && (
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
          )}
          {activeTab === 'domains' && (
            <div>
              <Label htmlFor="full_description">Full Description</Label>
              <Textarea
                id="full_description"
                value={formData.full_description}
                onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                placeholder="Enter detailed description"
                rows={4}
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaxonomyFormDialog;
