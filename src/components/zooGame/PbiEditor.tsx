import { useState } from 'react';
import type { BacklogItem, PbiDraft, ItemCategory } from './types';
import { suggestStory } from './engine';
import { SPECIES_SHAPES } from './design';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X, Wand2 } from 'lucide-react';

interface PbiEditorProps {
  zones: string[];
  /** The item being refined; omit to create a new PBI. */
  item?: BacklogItem;
  /** Existing enclosures an animal can be assigned to live in. */
  enclosures?: { id: string; name: string }[];
  /** Whether the user-story format defaults on (a preference, never forced). */
  useStories: boolean;
  onToggleStories: (on: boolean) => void;
  onSave: (draft: PbiDraft) => void;
  /** When refining an existing PBI, estimate it here too (estimation is part of refinement).
   *  Called on Save with the chosen points; omitted for brand-new PBIs (they arrive unsized). */
  onEstimate?: (points: number) => void;
  onCancel: () => void;
}

/** Parse "As a X, I want Y so that Z." back into its parts (best effort). */
function parseStory(s: string): { role: string; want: string; soThat: string } {
  const m = /^as\s+(.+?),?\s+i\s+want\s+(.+?)\s+so that\s+(.+?)\.?$/i.exec(s.trim());
  return m ? { role: m[1], want: m[2], soThat: m[3] } : { role: '', want: s, soThat: '' };
}

const CATEGORIES: { key: ItemCategory; label: string; hint: string }[] = [
  { key: 'exhibit', label: 'Animal', hint: 'an exhibit that lives in an enclosure' },
  { key: 'enclosure', label: 'Enclosure', hint: 'a habitat you build for animals' },
  { key: 'amenity', label: 'Facility', hint: 'cafe, toilets, seating' },
  { key: 'flora', label: 'Flora', hint: 'trees, bushes, flowers' },
];
const FOOTPRINTS: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
const NO_ENCLOSURE = '__none__';
const SERVICES: { key: 'food' | 'toilet' | 'rest'; label: string }[] = [
  { key: 'food', label: 'Food' }, { key: 'toilet', label: 'Toilets' }, { key: 'rest', label: 'Seating' },
];
const NEW_ZONE = '__new__';

/** Guess the Kind a PBI name implies, so we can nudge when it disagrees with the picked Kind
 *  (e.g. a name with "enclosure" while Kind is Animal). Returns null when the name gives no
 *  clear signal - animals are the default and are not name-detected. */
function suggestedCategory(name: string): ItemCategory | null {
  const n = name.toLowerCase();
  if (/enclosure|habitat|paddock|\bpen\b|aviary|vivarium|terrarium|reef tank|tank\b/.test(n)) return 'enclosure';
  if (/caf|kiosk|toilet|restroom|\bloo\b|\bshop\b|seating|bench|first aid|ticket|stand\b|stall\b/.test(n)) return 'amenity';
  if (/\btree|bush|shrub|flower|planting|hedge|fern|\boak\b|\bpalm\b|bamboo|flower bed|garden/.test(n)) return 'flora';
  return null;
}

/** The Product Owner writes or refines a Product Backlog Item: name, kind, zone and
 *  acceptance criteria. New PBIs arrive unsized, ready to estimate. */
const POINTS = [1, 2, 3, 5, 8, 13, 21];

export function PbiEditor({ zones, item, enclosures = [], useStories, onToggleStories, onSave, onEstimate, onCancel }: PbiEditorProps) {
  const editing = !!item;
  const [points, setPoints] = useState<number | null>(item && !item.unsized ? item.estimate : null);
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<ItemCategory>(item?.category ?? 'exhibit');
  const [zoneSel, setZoneSel] = useState(item?.zone ?? zones[0] ?? NEW_ZONE);
  const [newZone, setNewZone] = useState('');
  const [services, setServices] = useState<'food' | 'toilet' | 'rest' | undefined>(item?.services);
  const [footprint, setFootprint] = useState<'small' | 'medium' | 'large'>(item?.enclosureSize ?? 'medium');
  const [enclosureId, setEnclosureId] = useState<string>(item?.enclosureId ?? NO_ENCLOSURE);
  const [shape, setShape] = useState<string>(item?.template ?? '');
  const [acceptance, setAcceptance] = useState<string[]>(item?.acceptance?.length ? item.acceptance : ['']);
  const [storyMode, setStoryMode] = useState(item ? !!item.story : useStories);
  const parsed = parseStory(item?.story ?? '');
  const [role, setRole] = useState(parsed.role);
  const [want, setWant] = useState(parsed.want);
  const [soThat, setSoThat] = useState(parsed.soThat);

  const setAc = (i: number, v: string) => setAcceptance((a) => a.map((x, j) => (j === i ? v : x)));
  const zone = zoneSel === NEW_ZONE ? newZone : zoneSel;
  const valid = name.trim().length > 0 && zone.trim().length > 0;

  const toggleStory = (on: boolean) => { setStoryMode(on); onToggleStories(on); };
  const autoSuggest = () => { const s = suggestStory({ name, category, zone }); setRole(s.role); setWant(s.want); setSoThat(s.soThat); };
  const story = storyMode && (role.trim() || want.trim() || soThat.trim())
    ? `As ${role.trim() || 'a visitor'}, I want ${want.trim()} so that ${soThat.trim()}.` : undefined;

  const save = () => {
    if (!valid) return;
    onSave({
      name: name.trim(), story, category, zone: zone.trim(),
      acceptance: acceptance.filter((a) => a.trim()),
      services: category === 'amenity' ? services : undefined,
      enclosureSize: category === 'enclosure' ? footprint : undefined,
      enclosureId: category === 'exhibit' && enclosureId !== NO_ENCLOSURE ? enclosureId : undefined,
      template: category === 'exhibit' && shape ? shape : undefined,
    });
    // Estimation is part of refinement: apply the chosen points if they changed.
    if (editing && onEstimate && points !== null && (item!.unsized || points !== item!.estimate)) onEstimate(points);
  };

  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{editing ? `Refine "${item!.name}"` : 'New Product Backlog Item'}</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{storyMode ? 'Short label' : 'Name'}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meerkats, Ice cream stand, Oak tree"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      </label>

      {/* User-story format: optional, toggleable, with an auto-suggest. */}
      <div className="space-y-2 rounded-md border border-border bg-background/40 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-medium">
            <input type="checkbox" checked={storyMode} onChange={(e) => toggleStory(e.target.checked)} />
            Write as a user story
          </label>
          {storyMode && <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={autoSuggest}><Wand2 className="mr-1 h-3.5 w-3.5" /> Auto-suggest</Button>}
        </div>
        {storyMode && (
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-1.5"><span className="w-14 shrink-0 text-[11px] text-muted-foreground">As</span>
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="a visiting family" className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 outline-none focus:border-primary" /></div>
            <div className="flex items-center gap-1.5"><span className="w-14 shrink-0 text-[11px] text-muted-foreground">I want</span>
              <input value={want} onChange={(e) => setWant(e.target.value)} placeholder="to see meerkats in the Savanna" className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 outline-none focus:border-primary" /></div>
            <div className="flex items-center gap-1.5"><span className="w-14 shrink-0 text-[11px] text-muted-foreground">so that</span>
              <input value={soThat} onChange={(e) => setSoThat(e.target.value)} placeholder="the children stay engaged" className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 outline-none focus:border-primary" /></div>
            {story && <p className="rounded bg-muted/50 px-2 py-1 text-[11px] italic text-muted-foreground">{story}</p>}
          </div>
        )}
      </div>

      {!editing && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Kind</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                className={cn('rounded-full border px-3 py-1 text-xs', category === c.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')} title={c.hint}>{c.label}</button>
            ))}
          </div>
          {/* Nudge: if the name implies a different Kind than the one picked, offer a one-click switch. */}
          {(() => {
            const suggested = suggestedCategory(name);
            if (!suggested || suggested === category) return null;
            const label = CATEGORIES.find((c) => c.key === suggested)!.label;
            return (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-md border border-amber-300 bg-amber-50/70 px-2.5 py-1.5 text-[11px] text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200">
                <span>That name suggests <strong>{label}</strong>, but the Kind is <strong>{CATEGORIES.find((c) => c.key === category)!.label}</strong>.</span>
                <button type="button" onClick={() => setCategory(suggested)} className="rounded-full border border-amber-400 bg-background px-2 py-0.5 font-medium text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40">Switch to {label}</button>
              </div>
            );
          })()}
        </div>
      )}

      {!editing && category === 'amenity' && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Serves</span>
          <div className="flex flex-wrap gap-1.5">
            {SERVICES.map((s) => (
              <button key={s.key} type="button" onClick={() => setServices((v) => (v === s.key ? undefined : s.key))}
                className={cn('rounded-full border px-3 py-1 text-xs', services === s.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{s.label}</button>
            ))}
          </div>
        </div>
      )}

      {category === 'enclosure' && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Footprint</span>
          <div className="flex flex-wrap gap-1.5">
            {FOOTPRINTS.map((f) => (
              <button key={f} type="button" onClick={() => setFootprint(f)}
                className={cn('rounded-full border px-3 py-1 text-xs capitalize', footprint === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{f}</button>
            ))}
          </div>
        </div>
      )}

      {category === 'exhibit' && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Base shape</span>
          <select value={shape} onChange={(e) => setShape(e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm">
            <option value="">Generic creature</option>
            {SPECIES_SHAPES.map((sh) => <option key={sh.key} value={sh.key}>{sh.label}</option>)}
          </select>
          <p className="text-[10px] text-muted-foreground/70">The silhouette the studio starts from - just a starting point you tailor (parts, markings, colours). Pick one close to your animal.</p>
        </div>
      )}

      {category === 'exhibit' && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Lives in</span>
          <select value={enclosureId} onChange={(e) => setEnclosureId(e.target.value)} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm">
            <option value={NO_ENCLOSURE}>No enclosure yet</option>
            {enclosures.map((en) => <option key={en.id} value={en.id}>{en.name}</option>)}
          </select>
          <p className="text-[10px] text-muted-foreground/70">An animal is built into its enclosure, so the enclosure must be built first. Add an Enclosure PBI, then point the animal at it.</p>
        </div>
      )}

      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Zone</span>
        <div className="flex gap-2">
          <select value={zoneSel} onChange={(e) => setZoneSel(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm">
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
            <option value={NEW_ZONE}>+ New zone…</option>
          </select>
          {zoneSel === NEW_ZONE && (
            <input value={newZone} onChange={(e) => setNewZone(e.target.value)} placeholder="Zone name"
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Acceptance criteria</span>
        <div className="space-y-1.5">
          {acceptance.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input value={a} onChange={(e) => setAc(i, e.target.value)} placeholder="What makes it done and right?"
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary" />
              {acceptance.length > 1 && (
                <button type="button" onClick={() => setAcceptance((arr) => arr.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground" aria-label="Remove criterion"><X className="h-4 w-4" /></button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAcceptance((a) => [...a, ''])}><Plus className="mr-1 h-3.5 w-3.5" /> Add criterion</Button>
        </div>
      </div>

      {/* Estimation is part of refinement: size the item here (or leave it unsized to size later
          by planning poker). Only when refining an existing PBI. */}
      {editing && onEstimate && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Story points <span className="font-normal normal-case">- estimate as you refine</span></span>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setPoints(null)}
              className={cn('rounded-full border px-3 py-1 text-xs', points === null ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>? unsized</button>
            {POINTS.map((p) => (
              <button key={p} type="button" onClick={() => setPoints(p)}
                className={cn('rounded-full border px-3 py-1 text-xs tabular-nums', points === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')}>{p}</button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" disabled={!valid} onClick={save}>{editing ? 'Save' : 'Add to Backlog'}</Button>
      </div>
    </div>
  );
}
