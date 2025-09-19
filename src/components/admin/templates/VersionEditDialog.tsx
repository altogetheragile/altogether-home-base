import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useKnowledgeTemplateMutations } from '@/hooks/useKnowledgeTemplateMutations';

interface VersionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    title: string;
    version: string;
  } | null;
}

export const VersionEditDialog: React.FC<VersionEditDialogProps> = ({
  open,
  onOpenChange,
  template,
}) => {
  const [newVersion, setNewVersion] = useState('');
  const { updateTemplate } = useKnowledgeTemplateMutations();

  React.useEffect(() => {
    if (template) {
      setNewVersion(template.version);
    }
  }, [template]);

  const handleSave = () => {
    if (!template || !newVersion.trim()) return;

    updateTemplate.mutate(
      {
        id: template.id,
        data: { version: newVersion.trim() }
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        }
      }
    );
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Template Version</DialogTitle>
          <DialogDescription>
            Update the version number for "{template.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="version">Version Number</Label>
            <Input
              id="version"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="e.g., 1.0, 2.0, 1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!newVersion.trim() || updateTemplate.isPending}
          >
            {updateTemplate.isPending ? 'Saving...' : 'Save Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};