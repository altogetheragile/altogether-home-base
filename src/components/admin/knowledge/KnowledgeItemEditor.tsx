import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type KnowledgeItemEditorProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  knowledgeItem: any | null;   // ✅ renamed from editingItem → knowledgeItem
  onSuccess: () => void;
};

export function KnowledgeItemEditor({
  open,
  onOpenChange,
  knowledgeItem,
  onSuccess,
}: KnowledgeItemEditorProps) {
  // preload item data when editing
  useEffect(() => {
    if (knowledgeItem) {
      console.log('Editing item:', knowledgeItem);
      // TODO: populate form state with knowledgeItem values
    }
  }, [knowledgeItem]);

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
            {knowledgeItem ? 'Edit Knowledge Item' : 'Create Knowledge Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Example input — replace with real form controls */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              placeholder="Enter title"
              defaultValue={knowledgeItem?.title ?? ''}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {knowledgeItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
