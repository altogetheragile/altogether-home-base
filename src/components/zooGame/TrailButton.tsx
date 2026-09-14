import { useState } from 'react';
import { ClipboardCheck, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { trail } from './trail';
import { FOCUS } from './ui/tokens';

// ============= "What did you just press?" answered by the game =============
//
// The person who finds a fault is not the person who fixes it, and the gap between them is always
// the same sentence: "I think I chose the ground colour, then went inside, and then it was gone."
// That is an honest account and a poor one - memory keeps what it MEANT to do, drops the press that
// did nothing, and never includes the tick where a seat played by the game did something behind it.
//
// This copies the game's own account instead: the seed it started from and the last few dozen
// actions, in order. Pasted into a message it is a script, and a script can be replayed in a test
// until it breaks in the same place.

export function TrailButton() {
  const { data: role } = useUserRole();
  const [copied, setCopied] = useState(false);
  if (role !== 'admin') return null;

  const copy = async () => {
    const t = trail();
    const text = JSON.stringify(t);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard refused - a page that is not focused, or a browser that will not. The trail is
      // still worth having, so it goes to the console where it can be copied by hand.
      console.log('[zoo trail]', text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const count = trail().actions.length;
  return (
    <button type="button" onClick={copy} data-part="trail"
      title="Copy what has just been pressed - the seed and the last few dozen actions - so a fault can be replayed rather than described"
      className={cn(FOCUS, 'flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground')}>
      {copied ? <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Footprints className="h-3.5 w-3.5" />}
      <span className="hidden lg:inline">{copied ? 'Copied' : 'What I pressed'}</span>
      {count > 0 && <span className="rounded-full bg-muted px-1 text-[9px] font-bold">{count}</span>}
    </button>
  );
}
