import { useLayoutEffect, useRef } from 'react';
import { Trees, Repeat } from 'lucide-react';
import { Tab } from './ZooShell';
import { ZooOrientationBody } from './ZooOrientation';
import { ScrumOnePagerBody } from './ScrumTeaching';
import { ORIENTATION } from './scrumContent';
import { CopyEditor, type CopyEditorProps } from './CopyEditor';
import { ShowTeachingAgain } from './ShowTeachingAgain';
import { GameLinks } from './GameLinks';
import { motionWanted } from './motion';
import { cn } from '@/lib/utils';
import { ACTION_BAR, BAR_ACTION, FOCUS, TAB_ROW } from './ui/tokens';

// Two pages, one screen.
//
// Asked after playing through the way in: "can the Scrum one-pager and game orientation be tabbed
// so a player can easily switch between them?"
//
// They were two screens with a button on each pointing at the other, and every crossing cost a
// press and a scroll back to the top. Worse, the two buttons were not the same shape as each
// other: one said "What is Scrum? One page" and the other said "Start building the zoo", so going
// across and coming back were different moves with different names, and neither of them looked
// like the other tab of the same thing.
//
// They ARE two halves of one answer - what Scrum is, and what this game is - so they are one
// screen with two tabs, one way onward and one escape. Which tab you are on is the only thing that
// changes when you press.

export type StartTab = 'zoo' | 'scrum';

const TABS: { id: StartTab; label: () => string; icon: typeof Trees }[] = [
  // Read from the content, so renaming the screen in the copy editor renames its tab. A tab whose
  // label disagrees with the heading it opens is a small lie the game tells about itself.
  //
  // The icons are the ones each subject already wears: the park is trees, and the iterative loop is
  // the mark on the foundation Scrum employs it on.
  { id: 'zoo', label: () => ORIENTATION.title, icon: Trees },
  { id: 'scrum', label: () => 'Scrum on one page', icon: Repeat },
];

export function BeforeYouStart({ tab, onTab, onDone, read = 0, onForgetTeaching, copy }: {
  tab: StartTab;
  onTab: (t: StartTab) => void;
  onDone: () => void;
  /** How many teaching cards this browser remembers reading. The way out of that memory lives on
   *  this screen, and only shows when there is something to forget. */
  read?: number;
  onForgetTeaching?: () => void;
  copy?: CopyEditorProps;
}) {
  // The chosen tab brings itself into view. On a phone the row scrolls rather than squashing, so
  // the second tab is half off the edge - and tapping it selected a tab that stayed half off the
  // edge, which reads as a press that half worked.
  const row = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const on = row.current?.querySelector(`[data-part="start-tab-${tab}"]`);
    // Called defensively: not every environment that renders this has it, and a screen that throws
    // on the way in because it could not scroll a tab a few pixels is a poor trade.
    on?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: motionWanted() ? 'smooth' : 'auto' });
  }, [tab]);

  return (
    // The game frame never scrolls, so every screen inside it scrolls itself.
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-3 px-4 pb-24 pt-5">
        <header className="space-y-2">
          {/* Top left is the way out, on every screen of this game. The board's strip has the mark
              there and these two screens had nothing at all - no strip, no header, no link - so
              somebody who opened the game and thought better of it had the browser's back button
              and nothing the page offered. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="flex items-center gap-3">
              <GameLinks variant="home" />
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">Before you start</span>
            </span>
            {/* The way out of the game's memory, on the one screen where somebody setting up for a
                room is certain to pass. Invisible to a first-time player, because there is nothing
                to forget yet. */}
            <span className="flex items-center gap-2">
              {onForgetTeaching && <ShowTeachingAgain read={read} onForget={onForgetTeaching} />}
              {copy && <CopyEditor phase="intro" {...copy} />}
            </span>
          </div>
          {/* The game's own tab, not a second kind of tab.
              It had big bold labels with an underline, and got the same report the game's tab row
              already carries in its comment: "it is not clear they are tabs... outline colours?"
              An outlined shape that the active one joins to the panel below it is what a tab looks
              like here, and a player has already learnt that from the three tabs they meet next. */}
          <div ref={row} role="tablist" aria-label="Before you start"
            className={TAB_ROW}>
            {TABS.map((t) => (
              <Tab key={t.id} active={t.id === tab} onClick={() => onTab(t.id)} icon={t.icon} label={t.label()}
                role="tab" id={`start-tab-${t.id}`} aria-selected={t.id === tab}
                aria-controls={`start-panel-${t.id}`} data-part={`start-tab-${t.id}`} />
            ))}
          </div>
        </header>

        {/* Only the chosen one is mounted. The Scrum page is a hundred-odd panels and the zoo page
            draws an isometric park: mounting both and hiding one makes arriving at this screen pay
            for the half of it nobody asked for. */}
        <div role="tabpanel" id={`start-panel-${tab}`} aria-labelledby={`start-tab-${tab}`}>
          {tab === 'zoo' ? <ZooOrientationBody /> : <ScrumOnePagerBody />}
        </div>

        {/* One way onward, for both tabs. Whichever page you were reading, the next thing to do is
            the same thing.
            There used to be a second button here: "I have covered this - turn the teaching off". It
            is gone. It set a flag that hid this screen and the in-context cards, left the "?" on
            every screen and the whole Learn drawer exactly as they were, and reset itself to ON at
            the start of every new game - so the one person it was built for, a trainer opening a
            fresh zoo in front of a class they have just taught, had to press it every single time.
            Somebody who does not want to read this page can already leave it in one press, with
            this button.
            Which stays on the right, where the onward action has always been. The bar spaces its
            children apart, so the lone survivor of a pair slid to the left end of a wide pill and
            sat there looking like the escape rather than the way on. */}
        <div className={ACTION_BAR}>
          <button type="button" onClick={onDone} data-part="start-done"
            className={cn(FOCUS, BAR_ACTION, 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:ml-auto')}>
            {ORIENTATION.onward} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
