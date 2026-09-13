import { useState } from 'react';
import { SlidersHorizontal, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { DIALS, applyTuning, tune, type Dial, type DialGroup } from './tuning';
import { saveCopy } from './useZooCopy';
import { FOCUS } from './ui/tokens';

// ============= Turning the game's numbers, from inside the game =============
//
// The same bargain as the teaching copy, and for the same reason: the person who wants ground to be
// dearer is the person running the workshop, at the moment a group has found it too cheap. This
// lives beside the copy editor rather than in an admin screen because that is where the argument
// happens - "let us make that hurt more, go again" - and it saves into the same table.
//
// Only an admin sees it. What is a dial and what is not is decided in `tuning.ts`, and the rule
// there is worth repeating here: these change the ARGUMENT a group has, never a lesson. There is no
// dial that turns off an escape, and there will never be one that lets points buy anything.

const GROUP_HINT: Record<DialGroup, string> = {
  'What a visit is worth': 'What the zoo gains from a day somebody enjoyed.',
  'What carelessness costs': 'What comes off when an animal is kept badly.',
  'Growing the zoo': 'What the zoo has to be worth before it can grow.',
};

function DialRow({ dial, current, onSaved }: { dial: Dial; current?: string; onSaved: (key: string, value: string) => void }) {
  const { user } = useAuth();
  const set = current !== undefined ? Number(current) : dial.value;
  const [draft, setDraft] = useState(String(set));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turned = set !== dial.value;
  const dirty = Number(draft) !== set;
  const n = Number(draft);
  const bad = !Number.isFinite(n) || n < dial.min || n > dial.max;

  const save = async (value: string) => {
    setSaving(true);
    setError(null);
    // An empty box means "back to what the game shipped with", which is the same action as Reset:
    // an override is a layer, and removing the layer is how you take it off.
    const why = await saveCopy(dial.key, value, user?.id);
    setSaving(false);
    if (why) { setError(why); return; }
    onSaved(dial.key, value);
    // Applied at once, so the next Sprint Review uses it without a reload.
    applyTuning({ ...(value ? { [dial.key]: value } : {}) });
    setDraft(value || String(dial.value));
  };

  return (
    <div data-part="dial" data-key={dial.key} className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{dial.label}</span>
        <span className="text-[11px] text-muted-foreground">
          {turned ? <>shipped at <b className="font-semibold">{dial.value}</b></> : 'as shipped'}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{dial.hint}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input type="number" value={draft} min={dial.min} max={dial.max} step={dial.step ?? 1}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={dial.label}
          className={cn(FOCUS, 'w-28 rounded-md border bg-background px-2 py-1 text-sm font-bold tabular-nums',
            bad ? 'border-destructive' : 'border-border')} />
        {dial.unit && <span className="text-[11px] text-muted-foreground">{dial.unit}</span>}
        <Button size="sm" disabled={!dirty || bad || saving} onClick={() => save(draft)}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          <span className="ml-1">Save</span>
        </Button>
        {turned && (
          <Button size="sm" variant="ghost" disabled={saving} onClick={() => save('')}
            title={`Back to ${dial.value}, which is what the game shipped with`}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        )}
        <span className="text-[10px] text-muted-foreground">{dial.min} to {dial.max}</span>
      </div>
      {bad && <p className="mt-1 text-[11px] text-destructive">Between {dial.min} and {dial.max}.</p>}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

/** The dials in the game's header, and the panel they open. Only shown to an admin. */
export function DialEditor({ overrides, onChanged }: {
  overrides: Record<string, string>;
  onChanged: (key: string, value: string) => void;
}) {
  const { data: role } = useUserRole();
  const [open, setOpen] = useState(false);

  if (role !== 'admin') return null;

  const turned = DIALS.filter((d) => overrides[d.key] !== undefined).length;
  const groups = [...new Set(DIALS.map((d) => d.group))];

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)}
        title="Turn the game's numbers: what a visit is worth, what carelessness costs, what ground costs"
        className={cn(FOCUS, 'flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
          open ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground')}>
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Numbers</span>
        {turned > 0 && <span className="rounded-full bg-primary/15 px-1 text-[9px] font-bold text-primary">{turned}</span>}
      </button>

      {open && (
        <div data-part="dial-editor"
          className="fixed right-0 top-0 z-50 flex h-full w-[min(560px,94vw)] flex-col border-l border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> The game&rsquo;s numbers
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Live for everyone, and used from the next Sprint Review. Reset returns what the game shipped with.
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close"
              className={cn(FOCUS, 'text-muted-foreground hover:text-foreground')}><X className="h-4 w-4" /></button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
            {groups.map((g) => (
              <section key={g} className="space-y-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{g}</h3>
                  <p className="text-[11px] text-muted-foreground/80">{GROUP_HINT[g]}</p>
                </div>
                {DIALS.filter((d) => d.group === g).map((d) => (
                  <DialRow key={d.key} dial={d} current={overrides[d.key]} onSaved={onChanged} />
                ))}
              </section>
            ))}
            {/* What is deliberately not here. Said out loud, because the absence is the design and
                somebody will otherwise wonder where the switch is. */}
            <p className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] leading-snug text-muted-foreground">
              There are no dials for the lessons: points never buy anything, an escape always shuts
              the zone for the day, and a visit nobody enjoyed is always worth nothing. Those are
              what the game is for. These are how hard it argues.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Now: a visit worth making is {tune('tune.value.perVisit')}, keeping an animal badly
              costs {tune('tune.welfare.penalty')}, and ground for a new area
              is {tune('tune.ground.price')}.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
