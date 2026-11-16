import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BAR_ACTION, FOCUS } from './ui/tokens';

/** The way back into a saved game, on the dock of the screens before one starts.
 *
 *  It was only on the Product Goal screen, the second one in, so somebody coming back to a game
 *  had to step past the first screen to find it. "Move the resume saved game button or a copy of
 *  it the initial screen." Both screens use this one, so they cannot drift apart.
 *
 *  Grey text on a white pill is not a button anyone finds. Bordered, in the foreground colour, with
 *  the icon that says what it does. */
export function ResumeSavedGame({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} data-part="resume-saved"
      className={cn(FOCUS, BAR_ACTION, 'flex items-center gap-1.5 rounded-full border-2 border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted')}>
      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Resume a saved game
    </button>
  );
}
