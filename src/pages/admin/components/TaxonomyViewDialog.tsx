import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { TaxonomyItem, TaxonomyType, TabConfig } from './taxonomy-types';

interface TaxonomyViewDialogProps {
  item: TaxonomyItem | null;
  tabConfig: TabConfig;
  activeTab: TaxonomyType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

const TaxonomyViewDialog = ({
  item,
  tabConfig,
  activeTab,
  open,
  onOpenChange,
  onEdit,
}: TaxonomyViewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item?.name}</span>
            <Button onClick={onEdit} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Slug</Label>
            <p className="mt-1 font-mono text-sm">{item?.slug}</p>
          </div>
          {tabConfig.hasColor && item?.color && (
            <div>
              <Label className="text-muted-foreground">Color</Label>
              <div className="flex items-center space-x-3 mt-1">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: item?.color }}
                />
                <Badge style={{ backgroundColor: (item?.color || '') + '20', color: item?.color }}>
                  {item?.color}
                </Badge>
              </div>
            </div>
          )}
          {tabConfig.hasOrder && (
            <div>
              <Label className="text-muted-foreground">Display Order</Label>
              <p className="mt-1">{item?.display_order}</p>
            </div>
          )}
          {activeTab === 'tags' && (
            <div>
              <Label className="text-muted-foreground">Usage Count</Label>
              <p className="mt-1">{item?.usage_count || 0}</p>
            </div>
          )}
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="mt-1 text-sm">{item?.description || 'No description'}</p>
          </div>
          {activeTab === 'domains' && item?.full_description && (
            <div>
              <Label className="text-muted-foreground">Full Description</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">{item.full_description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p className="mt-1">{new Date(item?.created_at || '').toLocaleDateString()}</p>
            </div>
            {item?.updated_at && (
              <div>
                <Label className="text-muted-foreground">Updated</Label>
                <p className="mt-1">{new Date(item.updated_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaxonomyViewDialog;
