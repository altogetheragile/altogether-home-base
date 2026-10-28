import { useState } from 'react';
import { Layers, X, RotateCcw, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { saveCopy } from './useZooCopy';
import { DECK_KEY, LANDS_ON, SHIPPED_TRAINER_CARDS, applyDeck, trainerDeck, type TrainerCard } from './trainerCards';
import { FOCUS } from './ui/tokens';

// ============= The trainer's deck, from inside the game =============
//
// Beside the words and the numbers, for the same person and the same reason: the admin who wants a
// card that fits their own course is the one running it. Reword a card, take it out of the deck,
// or add one of your own. The whole deck is one row in `zoo_copy`, so Save writes it all at once
// and Reset puts back what the game shipped with.
//
// What an admin chooses is the story and which kind of trouble it is. What each kind costs, and the
// four answers the team has, stay the game's: a new card is a new situation, never a new rule.

const FIELD = cn(FOCUS, 'w-full rounded-md border border-border bg-background px-2 py-1 text-sm');

/** A new card's id, from its title, kept apart from every id already in the deck. */
function newId(title: string, taken: Set<string>): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'card';
  let id = `own-${base}`;
  for (let n = 2; taken.has(id); n++) id = `own-${base}-${n}`;
  return id;
}

function CardRow({ card, onChange, onRemove }: {
  card: TrainerCard; onChange: (c: TrainerCard) => void; onRemove?: () => void;
}) {
  const set = <K extends keyof TrainerCard>(k: K, v: TrainerCard[K]) => onChange({ ...card, [k]: v });
  return (
    <div data-part="deck-card" data-card={card.id}
      className={cn('space-y-1.5 rounded-lg border border-border bg-card px-3 py-2.5', card.off && 'opacity-60')}>
      <div className="flex items-center gap-2">
        <input aria-label="Title" value={card.title} onChange={(e) => set('title', e.target.value)}
          className={cn(FIELD, 'font-semibold')} />
        <label className="flex shrink-0 items-center gap-1 text-[11px]">
          <input type="checkbox" checked={!card.off} onChange={(e) => set('off', e.target.checked ? undefined : true)} />
          In the deck
        </label>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={`Remove ${card.title || 'this card'}`}
            className={cn(FOCUS, 'shrink-0 text-muted-foreground hover:text-destructive')}><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
      <textarea aria-label="What has happened" rows={2} value={card.detail} onChange={(e) => set('detail', e.target.value)}
        className={FIELD} />
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1 text-[11px]">
          Kind
          <select value={card.kind} onChange={(e) => set('kind', e.target.value as TrainerCard['kind'])}
            className={cn(FOCUS, 'rounded-md border border-border bg-background px-1 py-0.5 text-xs')}>
            <option value="block">A block: stops one item</option>
            <option value="impediment">An impediment: slows the whole team</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-[11px]">
          Lands on the
          <select value={card.landsOn} onChange={(e) => set('landsOn', e.target.value)}
            className={cn(FOCUS, 'rounded-md border border-border bg-background px-1 py-0.5 text-xs')}>
            {LANDS_ON.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
      </div>
      <textarea aria-label="What it teaches" rows={2} value={card.lesson} onChange={(e) => set('lesson', e.target.value)}
        placeholder="What it is there to teach. Only the trainer sees this." className={FIELD} />
    </div>
  );
}

/** The deck's button in the game's header, and the panel it opens. Only shown to an admin. */
export function DeckEditor({ overrides, onChanged }: {
  overrides: Record<string, string>;
  onChanged: (key: string, value: string) => void;
}) {
  const { data: role } = useUserRole();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TrainerCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (role !== 'admin') return null;

  const changed = overrides[DECK_KEY] !== undefined;
  const begin = () => { setDraft(trainerDeck().map((c) => ({ ...c }))); setError(null); setOpen(true); };
  const blank = draft.some((c) => !c.title.trim() || !c.detail.trim());

  const save = async (cards: TrainerCard[] | null) => {
    setSaving(true);
    setError(null);
    // Null is Reset: the row goes, and the deck is what the game shipped with.
    const value = cards ? JSON.stringify(cards, (k, v) => (k === 'shipped' ? undefined : v)) : '';
    const why = await saveCopy(DECK_KEY, value, user?.id);
    setSaving(false);
    if (why) { setError(why); return; }
    onChanged(DECK_KEY, value);
    applyDeck(value ? { [DECK_KEY]: value } : {});
    setDraft(trainerDeck().map((c) => ({ ...c })));
  };

  const add = () => {
    const taken = new Set(draft.map((c) => c.id));
    setDraft([...draft, { id: newId(`card ${draft.length + 1}`, taken), kind: 'block', title: '', detail: '', landsOn: 'Developers', lesson: '' }]);
  };

  return (
    <>
      <button type="button" onClick={() => (open ? setOpen(false) : begin())}
        title="The trainer's cards: reword them, take them out, or add your own"
        className={cn(FOCUS, 'flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
          open ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground')}>
        <Layers className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Cards</span>
        {changed && <span className="rounded-full bg-primary/15 px-1 text-[9px] font-bold text-primary">edited</span>}
      </button>

      {open && (
        <div data-part="deck-editor"
          className="fixed right-0 top-0 z-50 flex h-full w-[min(560px,94vw)] flex-col border-l border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <Layers className="h-4 w-4 text-primary" /> Trainer Cards
              </h2>
              <p className="text-[11px] text-muted-foreground">
                What a trainer can play into a Sprint. Saved for every session; a card already played keeps the words it was played with.
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close"
              className={cn(FOCUS, 'text-muted-foreground hover:text-foreground')}><X className="h-4 w-4" /></button>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {draft.map((c, i) => (
              <CardRow key={c.id} card={c}
                onChange={(next) => setDraft(draft.map((x, j) => (j === i ? next : x)))}
                onRemove={SHIPPED_TRAINER_CARDS.some((s) => s.id === c.id) ? undefined : () => setDraft(draft.filter((_, j) => j !== i))} />
            ))}
            <Button size="sm" variant="outline" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Add a card</Button>
            <p className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] leading-snug text-muted-foreground">
              A card is a situation, and the team answers it at the Daily Scrum like anything else in its way. A block
              stops one item: write &ldquo;this one&rdquo; and it becomes that item&rsquo;s name. An impediment slows the whole
              team. What each costs is the game&rsquo;s, so a new card never changes the rules. The cards the game shipped
              with can be taken out of the deck but not deleted.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2">
            <Button size="sm" disabled={saving || blank} onClick={() => void save(draft)}
              title={blank ? 'Every card needs a title and what has happened' : undefined}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span className="ml-1">Save the deck</span>
            </Button>
            {changed && (
              <Button size="sm" variant="ghost" disabled={saving} onClick={() => void save(null)}
                title="Back to the three cards the game shipped with">
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            )}
            {blank && <span className="text-[11px] text-destructive">Every card needs a title and what has happened.</span>}
            {error && <span className="text-[11px] text-destructive">{error}</span>}
          </div>
        </div>
      )}
    </>
  );
}
