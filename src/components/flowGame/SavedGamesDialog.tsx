import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Play, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFlowGameSaves, type FlowGameSaveMeta } from './useFlowGameSaves';
import type { GameState } from './types';

/** Human summary of where a save left off, from the denormalised columns. */
function whereLeftOff(s: FlowGameSaveMeta): string {
  switch (s.phase) {
    case 'playing-round-1': return `Round 1 · Day ${s.day ?? '?'}`;
    case 'playing-round-2': return `Round 2 · Day ${s.day ?? '?'}`;
    case 'metrics-round-1': return 'Round 1 results';
    case 'wip-setup': return 'Setting WIP limits';
    case 'metrics-final': return 'Finished';
    default: return 'Not started';
  }
}

interface SavedGamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: (id: string, state: GameState, name: string) => void;
}

export function SavedGamesDialog({ open, onOpenChange, onResume }: SavedGamesDialogProps) {
  const { saves, isLoading, loadGame, deleteGame } = useFlowGameSaves();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleResume = async (id: string) => {
    setBusyId(id);
    try {
      const state = await loadGame(id);
      const name = saves.find((s) => s.id === id)?.name ?? 'Saved game';
      onResume(id, state, name);
      onOpenChange(false);
    } catch {
      toast.error('Could not load that game. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteGame(id);
      toast.success('Saved game deleted');
    } catch {
      toast.error('Could not delete that game.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your saved games</DialogTitle>
          <DialogDescription>Pick up a game where you left off.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : saves.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No saved games yet. Save one from the board while you play.
          </p>
        ) : (
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
            {saves.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {whereLeftOff(s)} · saved {new Date(s.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button size="sm" disabled={busyId === s.id} onClick={() => handleResume(s.id)}>
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busyId === s.id} onClick={() => handleDelete(s.id)} aria-label={`Delete ${s.name}`}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
