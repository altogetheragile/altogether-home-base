import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectArtifacts, useProjectArtifactMutations } from '@/hooks/useProjectArtifacts';

interface SendToBacklogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Number of deliverables about to be sent (for the button label). */
  count: number;
  /** Called with the chosen (or newly created) product-backlog artifact id. */
  onConfirm: (backlogArtifactId: string) => void;
}

const NEW = '__new__';

/**
 * Choose which product backlog to send Impact Map deliverables to, or create a new
 * one. A product backlog is a project_artifacts row of type 'product-backlog', so it
 * also appears as a card on the project page.
 */
export function SendToBacklogDialog({ open, onOpenChange, projectId, count, onConfirm }: SendToBacklogDialogProps) {
  const { data: artifacts } = useProjectArtifacts(projectId);
  const { createArtifact } = useProjectArtifactMutations();
  const backlogs = (artifacts || []).filter((a) => a.artifact_type === 'product-backlog');

  const [choice, setChoice] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  // Effective selection: explicit choice, else the first backlog, else create-new.
  const effective = choice || (backlogs[0]?.id ?? NEW);
  const creating = effective === NEW || backlogs.length === 0;

  const confirm = async () => {
    setBusy(true);
    try {
      let backlogId = effective;
      if (creating) {
        const created = await createArtifact.mutateAsync({
          project_id: projectId,
          artifact_type: 'product-backlog',
          name: newName.trim() || 'Product Backlog',
          data: {},
        });
        backlogId = created.id;
      }
      onConfirm(backlogId);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send to which backlog?</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {backlogs.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-accent/40">
              <input
                type="radio"
                name="backlog-target"
                value={b.id}
                checked={effective === b.id}
                onChange={() => setChoice(b.id)}
              />
              <span className="text-sm">{b.name || 'Product Backlog'}</span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-accent/40">
            <input
              type="radio"
              name="backlog-target"
              value={NEW}
              checked={creating}
              onChange={() => setChoice(NEW)}
            />
            <span className="text-sm">Create a new backlog</span>
          </label>
          {creating && (
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New backlog name (e.g. Mobile app)"
              className="ml-6"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm} disabled={busy}>
            Send {count} {count === 1 ? 'item' : 'items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
