import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ZooIntroProps {
  productGoal: string;
  onSetGoal: (goal: string) => void;
  onStart: () => void;
}

/** Landing screen. The player is the Product Owner: they shape the Product Goal
 *  before the first Sprint, then run the zoo in Sprints. */
export function ZooIntro({ productGoal, onSetGoal, onStart }: ZooIntroProps) {
  const [goal, setGoal] = useState(productGoal);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">Build a Zoo</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Run a zoo in Sprints. Plan what to build, deliver it to your Definition of Done, open it to
          visitors, and hear what they think at the Review. Learn Scrum by doing it: forecast, inspect,
          and adapt as the visitors tell you what they value.
        </p>
      </div>

      <div className="grid w-full items-start gap-4 text-left sm:grid-cols-2">
        <div className="space-y-1.5 rounded-lg bg-muted/50 p-5">
          <h2 className="text-lg font-semibold">Each Sprint</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li><strong>Plan:</strong> commit exhibits and amenities you can finish.</li>
            <li><strong>Build:</strong> deliver each to the Definition of Done.</li>
            <li><strong>Open:</strong> release Done work to visitors whenever you like.</li>
            <li><strong>Review:</strong> the visitors turn up and tell you what worked.</li>
            <li><strong>Retro:</strong> pick one improvement, then plan the next Sprint.</li>
          </ul>
        </div>
        <div className="space-y-2 rounded-lg bg-muted/50 p-5">
          <h2 className="text-lg font-semibold">Your Product Goal</h2>
          <p className="text-xs text-muted-foreground">Shape it into one clear outcome. A good shape: a park that [who] love, so that [outcome].</p>
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Product Goal" />
        </div>
      </div>

      <Button size="lg" className="px-8 py-6 text-lg" onClick={() => { onSetGoal(goal); onStart(); }}>
        Start
      </Button>
    </div>
  );
}
