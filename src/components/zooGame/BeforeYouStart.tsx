import { GraduationCap, Trees, Repeat } from 'lucide-react';
import { Tab } from './ZooShell';
import { ZooOrientationBody } from './ZooOrientation';
import { ScrumOnePagerBody } from './ScrumTeaching';
import { ORIENTATION } from './scrumContent';
import { CopyEditor, type CopyEditorProps } from './CopyEditor';
import { cn } from '@/lib/utils';
import { ACTION_BAR, BAR_ACTION, FOCUS } from './ui/tokens';

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

export function BeforeYouStart({ tab, onTab, onDone, onSkipTeaching, copy }: {
  tab: StartTab;
  onTab: (t: StartTab) => void;
  onDone: () => void;
  onSkipTeaching: () => void;
  copy?: CopyEditorProps;
}) {
  return (
    // The game frame never scrolls, so every screen inside it scrolls itself.
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-3 px-4 pb-24 pt-5">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">Before you start</span>
            {copy && <CopyEditor phase="intro" {...copy} />}
          </div>
          {/* The game's own tab, not a second kind of tab.
              It had big bold labels with an underline, and got the same report the game's tab row
              already carries in its comment: "it is not clear they are tabs... outline colours?"
              An outlined shape that the active one joins to the panel below it is what a tab looks
              like here, and a player has already learnt that from the three tabs they meet next. */}
          <div role="tablist" aria-label="Before you start"
            className="flex items-end gap-1 overflow-x-auto border-b-2 border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        {/* One way onward and one escape, for both tabs. Whichever page you were reading, the next
            thing to do is the same thing. */}
        <div className={ACTION_BAR}>
          <button type="button" onClick={onSkipTeaching} data-part="skip-teaching"
            className={cn(FOCUS, BAR_ACTION, 'flex items-center gap-1.5 rounded-full border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted')}>
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            I have covered this - turn the teaching off
          </button>
          <button type="button" onClick={onDone} data-part="start-done"
            className={cn(FOCUS, BAR_ACTION, 'rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90')}>
            {ORIENTATION.onward} &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
