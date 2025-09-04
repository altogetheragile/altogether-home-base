import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type KnowledgeItemEditorProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  editingItem: any | null;
  onSuccess: () => void;
};

export function KnowledgeItemEditor({
  open,
  onOpenChange,
  editingItem,
  onSuccess,
}: KnowledgeItemEditorProps) {
  // You can preload item data when editing
  useEffect(() => {
    if (editingItem) {
      console.log('Editing item:', editingItem);
      // TODO: populate form state with editingItem values
    }
  }, [editingItem]);

  const handleSave = () => {
    // TODO: add save logic (e.g., Supabase update/insert)
    console.log('Saving knowledge item...');
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Example input — replace with form controls */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input placeholder="Enter title" defaultValue={editingItem?.title ?? ''} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
