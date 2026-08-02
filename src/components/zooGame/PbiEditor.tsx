import { useState } from 'react';
import type { BacklogItem, PbiDraft, ItemCategory } from './types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface PbiEditorProps {
  zones: string[];
  /** The item being refined; omit to create a new PBI. */
  item?: BacklogItem;
  onSave: (draft: PbiDraft) => void;
  onCancel: () => void;
}

const CATEGORIES: { key: ItemCategory; label: string; hint: string }[] = [
  { key: 'exhibit', label: 'Animal', hint: 'an exhibit' },
  { key: 'amenity', label: 'Facility', hint: 'cafe, toilets, seating' },
  { key: 'flora', label: 'Flora', hint: 'trees, bushes, flowers' },
];
const SERVICES: { key: 'food' | 'toilet' | 'rest'; label: string }[] = [
  { key: 'food', label: 'Food' }, { key: 'toilet', label: 'Toilets' }, { key: 'rest', label: 'Seating' },
];
const NEW_ZONE = '__new__';

/** The Product Owner writes or refines a Product Backlog Item: name, kind, zone and
 *  acceptance criteria. New PBIs arrive unsized, ready to estimate. */
export function PbiEditor({ zones, item, onSave, onCancel }: PbiEditorProps) {
  const editing = !!item;
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<ItemCategory>(item?.category ?? 'exhibit');
  const [zoneSel, setZoneSel] = useState(item?.zone ?? zones[0] ?? NEW_ZONE);
  const [newZone, setNewZone] = useState('');
  const [services, setServices] = useState<'food' | 'toilet' | 'rest' | undefined>(item?.services);
  const [acceptance, setAcceptance] = useState<string[]>(item?.acceptance?.length ? item.acceptance : ['']);

  const setAc = (i: number, v: string) => setAcceptance((a) => a.map((x, j) => (j === i ? v : x)));
  const zone = zoneSel === NEW_ZONE ? newZone : zoneSel;
  const valid = name.trim().length > 0 && zone.trim().length > 0;

  const save = () => {
    if (!valid) return;
    onSave({ name: name.trim(), category, zone: zone.trim(), acceptance: acceptance.filter((a) => a.trim()), services: category === 'amenity' ? services : undefined });
  };

  return (
    <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{editing ? `Refine "${item!.name}"` : 'New Product Backlog Item'}</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meerkats, Ice cream stand, Oak tree"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
      </label>

      {!editing && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Kind</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                className={cn('rounded-full border px-3 py-1 text-xs', category === c.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/40')} title={c.hint}>{c.label}</button>
            ))}
          </div>
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

      <div className="flex justify-end">
        <Button size="sm" disabled={!valid} onClick={save}>{editing ? 'Save' : 'Add to Backlog'}</Button>
      </div>
    </div>
  );
}
