import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SaveGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current name when updating an existing save; blank for a new one. */
  defaultName: string;
  isUpdate: boolean;
  saving: boolean;
  onSave: (name: string) => void;
}

export function SaveGameDialog({ open, onOpenChange, defaultName, isUpdate, saving, onSave }: SaveGameDialogProps) {
  const [name, setName] = useState(defaultName);

  // Reset the field to the current name each time the dialog opens.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (open) setName(defaultName); }, [open, defaultName]);

  const trimmed = name.trim();
  const submit = () => { if (trimmed) onSave(trimmed); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Update saved game' : 'Save game'}</DialogTitle>
          <DialogDescription>Give this game a name so you can find it later.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          placeholder="e.g. Workshop demo"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={!trimmed || saving}>{saving ? 'Saving...' : isUpdate ? 'Update' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
