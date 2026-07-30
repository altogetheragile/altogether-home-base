import { Button } from '@/components/ui/button';

interface ScrumIntroProps {
  productGoal: string;
  onStart: () => void;
}

/** Landing screen for the Scrum simulation. Sets up the loop and the three
 *  artifact commitments before play begins. */
export function ScrumIntro({ productGoal, onStart }: ScrumIntroProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">Scrum Simulation</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Run a product in Sprints. Forecast what you can deliver, play each day, and see what
          actually reaches Done - learning why focus, a realistic forecast, and a shared bar for
          "done" are what turn effort into value.
        </p>
      </div>

      <div className="grid w-full items-start gap-4 text-left sm:grid-cols-[3fr_2fr]">
        <div className="space-y-2 rounded-lg bg-muted/50 p-5">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><strong>Refine the Backlog:</strong> estimate the un-sized items and split the big ones, just enough to start - then keep refining a little during each Sprint, as much as it needs.</li>
            <li><strong>Sprint Planning:</strong> forecast Ready stories into a Sprint - you choose its length (one, two, or four weeks), and the events take their share of it.</li>
            <li><strong>Each day is a Daily Scrum:</strong> the Scrum Master clears impediments, the team decides who works on what, then run the day.</li>
            <li><strong>Sprint Review:</strong> what met the Definition of Done? Forecast vs actual.</li>
            <li><strong>Retrospective:</strong> pick one improvement to carry into the next Sprint.</li>
            <li>Repeat - and watch your <strong>velocity</strong> settle as your forecasts get honest.</li>
          </ul>
        </div>

        <div className="space-y-2 rounded-lg bg-muted/50 p-5">
          <h2 className="text-lg font-semibold">The three commitments</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><strong>Product Goal</strong> - the north star the backlog works toward.</li>
            <li><strong>Sprint Goal</strong> - one focus per Sprint.</li>
            <li><strong>Definition of Done</strong> - the bar an Increment must meet.</li>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-2xl rounded-lg border border-primary/30 bg-primary/5 px-5 py-3 text-left">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Product Goal</div>
        <p className="text-sm font-medium">{productGoal}</p>
      </div>

      <Button size="lg" onClick={onStart} className="px-8 py-6 text-lg">
        Start
      </Button>
    </div>
  );
}
