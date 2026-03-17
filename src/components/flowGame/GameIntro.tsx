import { Button } from '@/components/ui/button';

interface GameIntroProps {
  onStart: () => void;
}

export function GameIntro({ onStart }: GameIntroProps) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-16 px-4">
      <h1 className="text-4xl font-bold text-foreground">Kanban Flow Simulation</h1>
      <p className="text-lg text-muted-foreground">
        Experience why limiting work-in-progress improves flow. You'll play two rounds
        managing a Kanban board — first without constraints, then with WIP limits you choose.
      </p>

      <div className="bg-muted/50 rounded-lg p-6 text-left space-y-4">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li><strong>20 work items</strong> need to flow through Analysis, Development, and Test.</li>
          <li><strong>6 workers</strong> — each specialises in one column (full effectiveness) but can work anywhere (at 60%).</li>
          <li>Each day: assign workers to cards, then click <strong>Run Day</strong>. Dice determine progress.</li>
          <li><strong>Blockers</strong> appear randomly — a worker must clear them before work resumes.</li>
          <li>After 20 days, you'll see your metrics. Then you'll set WIP limits and try again.</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
        <h2 className="text-xl font-semibold">Your goal</h2>
        <p className="text-muted-foreground">
          Get as many items to Done as possible with the shortest cycle times.
          After both rounds, you'll see Little's Law in action with your own numbers.
        </p>
      </div>

      <Button size="lg" onClick={onStart} className="text-lg px-8 py-6">
        Start Round 1
      </Button>
    </div>
  );
}
