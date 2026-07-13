import { useState } from 'react';
import type { Developer } from './types';
import { makeDeveloper, devColor, MIN_TEAM, MAX_TEAM } from './config';
import { DevBadge } from './DevBadge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, X } from 'lucide-react';

interface ScrumTeamEditorProps {
  team: Developer[];
  onSave: (team: Developer[]) => void;
}

let nextDevSeq = 1000;
const newDevId = () => `d${nextDevSeq++}`;

/** Edit the Scrum Team's roster between Sprints: rename, add or remove Developers.
 *  A bigger team can take on more, but only if the work is there to swarm on. */
export function ScrumTeamEditor({ team, onSave }: ScrumTeamEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Developer[]>(() => team.map((d) => ({ ...d })));

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(team.map((d) => ({ ...d })));
    setOpen(next);
  };

  const rename = (id: string, name: string) =>
    setDraft((prev) => prev.map((d) => (d.id === id ? makeDeveloper(id, name) : d)));
  const remove = (id: string) => setDraft((prev) => prev.filter((d) => d.id !== id));
  const add = () => setDraft((prev) => [...prev, makeDeveloper(newDevId(), `Dev ${prev.length + 1}`)]);

  const handleSave = () => {
    // Keep names non-empty and re-derive initials, then apply.
    onSave(draft.map((d) => makeDeveloper(d.id, d.name)));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-1.5 h-4 w-4" /> Edit team ({team.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scrum Team</DialogTitle>
          <DialogDescription>
            Rename, add or remove Developers. A team of {MIN_TEAM} to {MAX_TEAM} keeps things
            legible. Changes apply from the next Sprint you plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {draft.map((d, i) => (
            <div key={d.id} className="flex items-center gap-2">
              <DevBadge initials={d.initials} colorClass={devColor(i)} />
              <Input
                value={d.name}
                onChange={(e) => rename(d.id, e.target.value)}
                className="h-8 flex-1"
                aria-label={`Developer ${i + 1} name`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive"
                disabled={draft.length <= MIN_TEAM}
                onClick={() => remove(d.id)}
                aria-label={`Remove ${d.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={draft.length >= MAX_TEAM}
            onClick={add}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Developer
          </Button>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save team</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
