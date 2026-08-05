import type { ZooGameState } from './types';
import { openZoo } from './engine';
import { Button } from '@/components/ui/button';

interface ZooFinalProps {
  state: ZooGameState;
  onReset: () => void;
}

/** Wrap-up: the Product Goal is met. A snapshot of the zoo you built and how it ran. */
export function ZooFinal({ state, onReset }: ZooFinalProps) {
  const r = state.lastReview;
  const open = openZoo(state);
  const exhibits = open.filter((i) => i.category === 'exhibit').length;
  const amenities = open.filter((i) => i.category === 'amenity').length;

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">Your zoo is open</h1>
        <p className="text-muted-foreground">You reached the Product Goal in {state.sprintNumber} Sprint{state.sprintNumber === 1 ? '' : 's'}.</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Exhibits" value={`${exhibits}`} />
        <Stat label="Amenities" value={`${amenities}`} />
        <Stat label="Visitors" value={r ? r.totalAttendance.toLocaleString() : '0'} />
        <Stat label="Happiness" value={r ? `${r.overallHappiness}` : '0'} />
      </div>
      <p className="max-w-md text-sm text-muted-foreground">Velocity across the Sprints: {state.velocity.join(', ') || 'none'}. The visitors kept telling you what they valued - and you built a zoo around it.</p>
      <Button size="lg" onClick={onReset}>Build another zoo</Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
