import type { BacklogItem } from './types';
import { BUILDING_TYPES, FLORA_TYPES } from './design';
import { cn } from '@/lib/utils';
import { FOCUS } from './ui/tokens';

// ============= Deciding what KIND of thing this is =============
//
// Topic three of Sprint Planning is how the work gets done, and the first "how" for most items is
// what shape it takes: how big the habitat is, which habitat the animal lives in, what sort of
// building or planting this is. Those decide the work, its order and its dependencies, so they are
// planning decisions.
//
// What is NOT here is the craft - colour, features, exactly where it sits. That belongs in the
// build, with the thing in front of you, and settling it at Planning would be big design up front
// wearing a Scrum hat. Nothing chosen here is fixed either: the Developers change any of it during
// the Sprint, because the plan is theirs and they adapt it daily.

const SIZES = [
  { key: 'small', label: 'Small', hint: 'One or two animals' },
  { key: 'medium', label: 'Medium', hint: 'A small group' },
  { key: 'large', label: 'Large', hint: 'Room to roam' },
] as const;

const BUILDING_LABEL: Record<string, string> = {
  kiosk: 'Kiosk', cafe: 'Cafe', shop: 'Shop', stall: 'Stall', toilets: 'Toilets',
};

function Choice({ options, value, onPick }: { options: { key: string; label: string; hint?: string }[]; value?: string; onPick: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button key={o.key} type="button" onClick={() => onPick(o.key)} title={o.hint}
          className={cn(FOCUS, 'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
            value === o.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The shape decisions this item needs, if any. Returns null when there is nothing to decide - a
 *  pathway needs no kind, and the game should not invent a question to ask. */
export function ShapeChooser({ item, enclosures, onPlan }: {
  item: BacklogItem;
  /** Habitats already in the Backlog, for an animal to be assigned to. */
  enclosures: { id: string; name: string }[];
  onPlan: (patch: { enclosureSize?: 'small' | 'medium' | 'large'; enclosureId?: string; template?: string }) => void;
}) {
  if (item.category === 'enclosure') {
    return (
      <Field label="How big?">
        <Choice options={SIZES.map((s) => ({ key: s.key, label: s.label, hint: s.hint }))}
          value={item.enclosureSize ?? 'medium'} onPick={(k) => onPlan({ enclosureSize: k as 'small' | 'medium' | 'large' })} />
      </Field>
    );
  }

  if (item.category === 'exhibit') {
    // The dependency that makes the habitat come first: an animal cannot be built until the
    // enclosure it lives in is Done, so deciding this decides the order of the Sprint.
    return (
      <Field label="Which habitat does it live in?" note="The habitat has to be built before the animal can start.">
        <Choice options={enclosures.map((e) => ({ key: e.id, label: e.name }))}
          value={item.enclosureId} onPick={(k) => onPlan({ enclosureId: k === item.enclosureId ? '' : k })} />
      </Field>
    );
  }

  if (item.category === 'amenity') {
    return (
      <Field label="What kind of building?">
        <Choice options={BUILDING_TYPES.map((t) => ({ key: t, label: BUILDING_LABEL[t] ?? t }))}
          value={item.template} onPick={(k) => onPlan({ template: k })} />
      </Field>
    );
  }

  if (item.category === 'flora') {
    return (
      <Field label="What kind?">
        <Choice options={FLORA_TYPES.map((t) => ({ key: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          value={item.template} onPick={(k) => onPlan({ template: k })} />
      </Field>
    );
  }

  return null;
}

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold">{label}</div>
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
      {children}
    </div>
  );
}
