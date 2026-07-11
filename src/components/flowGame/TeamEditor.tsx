import { useState } from 'react';
import type { StageDef, WorkerDef } from './types';
import { normalizeWorkers } from './config';
import { TeamMemberList } from './TeamMemberList';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface TeamEditorProps {
  workers: WorkerDef[];
  stages: StageDef[];
  onSave: (workers: WorkerDef[]) => void;
}

/** In-game team editor: rename / add / remove / reassign people without leaving
 *  the round. Stages stay fixed here (cards live in stage columns), so only the
 *  roster is editable. Changes apply to the running round and carry to Round 2. */
export function TeamEditor({ workers, stages, onSave }: TeamEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<WorkerDef[]>(() => workers.map((w) => ({ ...w })));

  // Re-seed from the live roster each open, so Cancel discards and a re-open
  // reflects the current team.
  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(workers.map((w) => ({ ...w })));
    setOpen(next);
  };

  const handleSave = () => {
    onSave(normalizeWorkers(draft, stages));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-1.5 h-4 w-4" /> Edit team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit team</DialogTitle>
          <DialogDescription>
            Rename, add, remove or reassign people for this game. Removing someone frees any
            card they were on. The stages stay fixed mid-round.
          </DialogDescription>
        </DialogHeader>

        <TeamMemberList workers={draft} stages={stages} onChange={setDraft} />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save team</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
