import { Button } from '@/components/ui/button';

interface GameIntroProps {
  onStart: () => void;
}

export function GameIntro({ onStart }: GameIntroProps) {
  return (
    // Fill the viewport below the 4rem nav and centre the card, so the whole
    // brief - heading through the Start button - sits above the fold with no
    // scroll. The two info boxes go side by side to keep it short vertically.
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">Kanban Flow Simulation</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Experience why limiting work-in-progress improves flow. You'll play two rounds
          managing a Kanban board - first without constraints, then with WIP limits you choose.
        </p>
      </div>

      <div className="grid w-full gap-4 text-left sm:grid-cols-2">
        <div className="rounded-lg bg-muted/50 p-5 space-y-2">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><strong>20 work items</strong> flow through Analysis, Development, and Test.</li>
            <li><strong>6 workers</strong> - each specialises in one column (full effectiveness) but can work anywhere (at 60%).</li>
            <li>Each day: assign workers to cards, then click <strong>Run Day</strong>. Dice determine progress.</li>
            <li><strong>Blockers</strong> appear randomly - a worker must clear them before work resumes.</li>
            <li>After 20 days you'll see your metrics, then set WIP limits and try again.</li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/50 p-5 space-y-2">
          <h2 className="text-lg font-semibold">Your goal</h2>
          <p className="text-sm text-muted-foreground">
            Get as many items to Done as possible with the shortest cycle times.
            After both rounds, you'll see Little's Law in action with your own numbers.
          </p>
        </div>
      </div>

      <Button size="lg" onClick={onStart} className="px-8 py-6 text-lg">
        Start Round 1
      </Button>
    </div>
  );
}
