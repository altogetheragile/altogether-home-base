import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { ProjectArtifact } from '@/hooks/useProjectArtifacts';
import { Loader2 } from 'lucide-react';

interface RenameArtifactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: ProjectArtifact;
  onRename: (artifactId: string, name: string, description?: string) => void;
  isRenaming?: boolean;
}

export const RenameArtifactDialog: React.FC<RenameArtifactDialogProps> = ({
  open,
  onOpenChange,
  artifact,
  onRename,
  isRenaming = false,
}) => {
  const [name, setName] = useState(artifact.name);
  const [description, setDescription] = useState(artifact.description || '');

  // Reset form when artifact changes
  useEffect(() => {
    setName(artifact.name);
    setDescription(artifact.description || '');
  }, [artifact.name, artifact.description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onRename(artifact.id, name.trim(), description.trim() || undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Artifact</DialogTitle>
            <DialogDescription>
              Update the name and description for this artifact.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter artifact name"
                required
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter artifact description (optional)"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isRenaming || !name.trim()}>
              {isRenaming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
