import { Trees, Users, Boxes, Clock, Lightbulb, ArrowRight } from 'lucide-react';
import { Section, Row } from './ScrumTeaching';
import { LabelledPark } from './LabelledPark';
import { ORIENTATION, INTRO_COPY } from './scrumContent';
import { CopyEditor, type CopyEditorProps } from './CopyEditor';
import { cn } from '@/lib/utils';
import { ACTION_BAR, BAR_ACTION, FOCUS, TEXT } from './ui/tokens';

// What am I looking at?
//
// "Scrum on one page" answers what Scrum is. Nothing answered what the GAME is - the park and its
// areas, the five seats, the three tabs, the clock, and the three rules that catch everybody out.
// A learner who knows Scrum perfectly well still does not know any of that, and was finding it out
// by pressing things.
//
// It sits in front of the Product Goal rather than on the same page as it. The Product Goal is the
// one thing that screen asks anybody to write and it was deliberately put at the top of it - a
// block of orientation above it would push it down again, which is the fault that put it there.
// A screen you pass through once is not the same as a panel that is always in the way.

/** The five steps of a Sprint, against when each one happens. The steps themselves come from
 *  INTRO_COPY, which is where the front page reads them from too: one source, two views of it. A
 *  second copy of these five lines is a second answer waiting to disagree. */
function TheSprint() {
  return (
    <ol className="space-y-1.5">
      {INTRO_COPY.loop.map((l, i) => (
        <li key={l.step} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-3 text-xs leading-snug">
          <span className="text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {ORIENTATION.when[i]}
          </span>
          <span>
            <span className="font-semibold text-foreground">{l.step}</span>
            <span className="text-muted-foreground"> - {l.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The manual, before the first decision. Skippable, and reachable again from the intro. */
export function ZooOrientation({ onDone, onScrum, onBack, copy }: {
  onDone: () => void;
  /** Across to the framework itself, for somebody who wants it before they start. */
  onScrum?: () => void;
  onBack?: () => void;
  copy?: CopyEditorProps;
}) {
  const O = ORIENTATION;
  return (
    // The game frame never scrolls, so every screen inside it scrolls itself.
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-3 px-4 pb-24 pt-5">
        <header className="space-y-1">
          {onBack && (
            <button type="button" onClick={onBack} className={cn(FOCUS, 'mb-1 block text-[11px] text-muted-foreground underline-offset-2 hover:underline')}>
              &larr; Back
            </button>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">Before you start</span>
            {copy && <CopyEditor phase="intro" {...copy} />}
          </div>
          <h2 className={TEXT.screen}>{O.title}</h2>
          <p className="text-sm leading-snug text-muted-foreground">{O.strapline}</p>
        </header>

        {/* The zoo, before the words about it. Somebody built this one by playing the game, and the
            numbers name the parts the toolbar will ask you about. */}
        <LabelledPark />

        <div className="grid gap-3 sm:grid-cols-2">
          <Section title={O.park.title} tone="events" icon={Trees}>
            <p className="text-xs leading-snug text-muted-foreground">{O.park.lead}</p>
            {O.park.rows.map((r) => <Row key={r.name} name={r.name} text={r.text} />)}
          </Section>
          <Section title={O.seats.title} tone="team" icon={Users}>
            <p className="text-xs leading-snug text-muted-foreground">{O.seats.lead}</p>
            {O.seats.rows.map((r) => <Row key={r.name} name={r.name} note={r.note} text={r.text} />)}
          </Section>
          <Section title={O.tabs.title} tone="artifacts" icon={Boxes}>
            <p className="text-xs leading-snug text-muted-foreground">{O.tabs.lead}</p>
            {O.tabs.rows.map((r) => <Row key={r.name} name={r.name} text={r.text} />)}
          </Section>
          <Section title={O.clock.title} tone="founded" icon={Clock}>
            <p className="text-xs leading-snug text-muted-foreground">{O.clock.lead}</p>
            {O.clock.rows.map((r) => <Row key={r.name} name={r.name} text={r.text} />)}
          </Section>
        </div>

        <Section title={INTRO_COPY.loopTitle} tone="events" icon={ArrowRight}>
          <TheSprint />
        </Section>

        {/* Said plainly here rather than found by losing a Sprint to it. Each of these is a rule
            somebody has reported as a bug after meeting it the hard way. */}
        <Section title={O.gotchas.title} tone="values" icon={Lightbulb}>
          {O.gotchas.rows.map((r) => <Row key={r.name} name={r.name} text={r.text} />)}
        </Section>

        {/* Floating, like every other primary action in the game. */}
        <div className={ACTION_BAR}>
          {onScrum ? (
            <button type="button" onClick={onScrum} data-part="to-scrum"
              className={cn(FOCUS, BAR_ACTION, 'flex items-center gap-1.5 rounded-full border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted')}>
              {O.aside}
            </button>
          ) : <span />}
          <button type="button" onClick={onDone} data-part="orientation-done"
            className={cn(FOCUS, BAR_ACTION, 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90')}>
            {O.onward} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
