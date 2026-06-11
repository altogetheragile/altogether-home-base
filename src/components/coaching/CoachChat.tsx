import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CoachTurn, CoachMode } from '@/types/coaching';

interface CoachChatProps {
  /** Tool key, e.g. 'impact-map', for the coach prompt context. */
  tool: string;
  /** The cell being filled. */
  cell: { tag: string; question: string; stretch: string };
  /** Optional initiative intent, prepended as grounding. */
  intentStatement?: string;
  /** Called when the user accepts the coach's drafted value for the cell. */
  onAccept: (text: string) => void;
  onClose?: () => void;
}

const TEAL = '#004D4D';
const ORANGE = '#FF9715';

/**
 * A non-directive coaching conversation that fills one cell in the user's own
 * words, via the coach-reflect edge function. Includes the Contracted Mode
 * Switch (coach vs guide) with legible, colour-distinct voices.
 */
export function CoachChat({ tool, cell, intentStatement, onAccept, onClose }: CoachChatProps) {
  const [turns, setTurns] = useState<CoachTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<CoachMode>('coach');
  const [draft, setDraft] = useState<string | null>(null);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const callCoach = async (conversation: CoachTurn[], useMode: CoachMode) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('coach-reflect', {
        body: {
          tool,
          cellTag: cell.tag,
          question: cell.question,
          stretch: cell.stretch,
          intentStatement,
          conversation,
          mode: useMode,
        },
      });
      if (error) throw error;
      const message = data?.next_question || data?.reflection;
      if (message) setTurns((prev) => [...prev, { role: 'coach', text: message }]);
      if (data?.draft) setDraft(data.draft);
    } catch {
      toast.error('The coach is unavailable right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Open with the first question.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void callCoach([], 'coach');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, busy]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: CoachTurn[] = [...turns, { role: 'user', text }];
    setTurns(next);
    setInput('');
    setDraft(null);
    void callCoach(next, mode);
  };

  const askForSuggestions = () => {
    if (busy) return;
    setMode('guide');
    void callCoach(turns, 'guide');
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: mode === 'coach' ? TEAL : ORANGE }}>
          {mode === 'coach' ? 'Coaching conversation' : 'Guide: suggestions'}
        </span>
        {onClose && (
          <button aria-label="Close coach" className="text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'text-right' : ''}>
            <span
              className="inline-block max-w-[85%] rounded-lg px-3 py-1.5 text-sm"
              style={
                t.role === 'coach'
                  ? { background: 'rgba(0,77,77,0.08)', color: '#0f172a' }
                  : { background: 'rgba(255,151,21,0.14)', color: '#0f172a' }
              }
            >
              {t.text}
            </span>
          </div>
        ))}
        {busy && (
          <div className="text-sm text-muted-foreground">
            <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> thinking...
          </div>
        )}
      </div>

      {draft && (
        <div className="mt-2 rounded-md border p-2" style={{ borderColor: 'rgba(0,77,77,0.4)', background: 'rgba(0,77,77,0.05)' }}>
          <p className="mb-1 text-xs text-muted-foreground">Drafted from your words:</p>
          <p className="mb-2 text-sm font-medium">{draft}</p>
          <Button size="sm" onClick={() => onAccept(draft)}>Use this</Button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply..."
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          disabled={busy}
        />
        <Button size="icon" onClick={send} disabled={busy || !input.trim()} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {mode === 'coach' && (
        <button
          className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          onClick={askForSuggestions}
          disabled={busy}
        >
          <Sparkles className="h-3.5 w-3.5" /> Would you like me to suggest some options?
        </button>
      )}
    </div>
  );
}
