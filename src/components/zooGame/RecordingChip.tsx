import { useEffect, useState } from 'react';
import { Circle, ClipboardCheck } from 'lucide-react';
import { trail, recording } from './trail';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

// You are being recorded, and here is what was recorded.
//
// Recording a zoo to show somebody is an authoring session, and it needs two things the ordinary
// game does not: to say plainly that every press is being kept, and to hand the result over in one
// press at the end.
//
// The trail has been copyable from the game menu for a while, but only for an admin and only by
// somebody who knows it is there. That is right for a bug report, which is asked for. It is wrong
// for this, which is a job somebody has sat down to do.
//
// Only on `?record=1`. Nothing about the ordinary game changes.

export function RecordingChip() {
  const [on, setOn] = useState(false);
  const [steps, setSteps] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);

  // Read after mount rather than during render: recording is turned on by an effect in the game's
  // own hook, and a component that asks too early is told no on the first paint of every session.
  //
  // The COUNT is here for the same reason the word Recording is: somebody about to spend twenty
  // minutes building a zoo to show people should be able to see the thing ticking up before they
  // spend them, not find out at the end whether it was on.
  useEffect(() => {
    const id = window.setInterval(() => {
      setOn(recording());
      setSteps(trail().actions.length);
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  if (!on) return null;

  const copy = async () => {
    const t = trail();
    const text = JSON.stringify(t);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // A clipboard the browser will not give up is not a dead end: the trail is on the console,
      // which is where somebody recording a session can still get at it.
      console.log('[zoo trail]', text);
    }
    setCopied(t.actions.length);
    window.setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-full border-2 border-destructive/60 bg-background/95 px-2.5 py-1 text-[11px] font-semibold shadow-lg backdrop-blur">
      <Circle className="h-2.5 w-2.5 shrink-0 animate-pulse fill-destructive text-destructive" aria-hidden />
      <span className="text-foreground">Recording</span>
      <span data-part="trail-steps" className="tabular-nums text-muted-foreground">{steps}</span>
      <button type="button" onClick={copy} data-part="copy-trail"
        className={cn(FOCUS, 'flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground')}>
        <ClipboardCheck className="h-3 w-3" />
        {copied === null ? 'Copy the trail' : `${copied} steps copied`}
      </button>
    </div>
  );
}
