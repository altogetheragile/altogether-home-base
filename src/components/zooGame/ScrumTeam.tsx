import { useState } from 'react';
import type { ScrumTeam, ScrumTeamMember } from './types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Users, Check } from 'lucide-react';
import { FOCUS, PADDING, SURFACE, TONE } from './ui/tokens';

// A stable colour per Developer id, so the same person reads the same everywhere.
const DEV_COLORS = ['#e6842a', '#3f8fd0', '#43a047', '#8a5a2b', '#c17a5c', '#7c4dff'];
const devColor = (id: string, devs: ScrumTeamMember[]) => DEV_COLORS[Math.max(0, devs.findIndex((d) => d.id === id)) % DEV_COLORS.length];
const initial = (name: string) => (name.replace(/\s*\(.*\)\s*/, '').trim()[0] ?? '?').toUpperCase();

/** A round initial avatar for a Developer. */
function Avatar({ name, colour, size = 18, ring = false, dim = false }: { name: string; colour: string; size?: number; ring?: boolean; dim?: boolean }) {
  return (
    <span title={name} aria-label={name}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white', ring && 'ring-2 ring-offset-1 ring-primary', dim && 'opacity-30')}
      style={{ width: size, height: size, background: colour, fontSize: size * 0.5 }}>
      {initial(name)}
    </span>
  );
}

/** An editable member name - click to rename (a future multiplayer seat). */
function EditableName({ member, onRename, className }: { member: ScrumTeamMember; onRename?: (id: string, name: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(member.name);
  if (editing && onRename) {
    return (
      <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onRename(member.id, draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onRename(member.id, draft); setEditing(false); } if (e.key === 'Escape') { setDraft(member.name); setEditing(false); } }}
        className="w-20 rounded border border-primary bg-background px-1 py-0 text-[11px] outline-none" />
    );
  }
  return (
    <button type="button" onClick={() => onRename && (setDraft(member.name), setEditing(true))} className={cn(FOCUS, 'truncate', onRename && 'hover:underline', className)} title={onRename ? 'Rename' : undefined}>
      {member.name}
    </button>
  );
}

/** How a member travels from the team row to a card: the drag payload the board listens for.
 *  Prefixed, because the board already drags CARDS between columns with a bare item id. */
export const MEMBER_DRAG = 'zoo/member:';

/** The Scrum Team along the top, each one draggable onto the work.
 *
 *  Dragging a person onto a Product Backlog item is how the Flow Game says "I will take that", and
 *  it is how a self-managing team decides who does what: nobody is assigned, somebody takes it.
 *  Only the Developers can be dropped on work - the Scrum Guide has the Product Owner and Scrum
 *  Master taking part as Developers only when they are working on Sprint Backlog items, and this
 *  game keeps the accountabilities separate so their names stay off the cards.
 */
export function TeamRow({ team, onRename, onWho }: {
  team: ScrumTeam;
  onRename?: (id: string, name: string) => void;
  /** Somebody was dropped where they cannot be dropped, so the game says why rather than nothing. */
  onWho?: (why: string) => void;
}) {
  const drag = (id: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'copy';
      try { e.dataTransfer.setData('text/plain', MEMBER_DRAG + id); } catch { /* some browsers */ }
    },
  });
  const cannot = (who: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.preventDefault();
      onWho?.(`${who} take part as Developers only when they are working on Sprint Backlog items. In this zoo their accountability is kept separate, so their name does not go on the work.`);
    },
  });
  return (
    <div data-part="team-row" className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1" {...cannot('Product Owners')} title="The Product Owner">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">PO</span>
        <EditableName member={team.productOwner} onRename={onRename} className="text-[11px] font-medium" />
      </span>
      <span className={cn('flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1')} {...cannot('Scrum Masters')} title="The Scrum Master">
        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white')}>SM</span>
        <EditableName member={team.scrumMaster} onRename={onRename} className="text-[11px] font-medium" />
      </span>
      {team.developers.map((d) => (
        <span key={d.id} {...drag(d.id)}
          title={`${d.name} - drag onto a card to take that work`}
          className="flex cursor-grab items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 active:cursor-grabbing">
          <Avatar name={d.name} colour={devColor(d.id, team.developers)} size={24} />
          <EditableName member={d} onRename={onRename} className="text-[11px] font-medium" />
        </span>
      ))}
      <span className="text-[11px] text-muted-foreground">Drag a Developer onto a card to take that work.</span>
    </div>
  );
}

/** The Scrum Team, made visible: the three accountabilities in one strip. Names are editable
 *  (seats a future multiplayer mode can hand to real people). `compact` drops the border/label
 *  so it can ride inline in the board toolbar instead of eating a full row; the full detail
 *  (roles, names) opens in a popover. */
export function ScrumTeamStrip({ team, onRename, compact = false }: { team: ScrumTeam; onRename?: (id: string, name: string) => void; compact?: boolean }) {
  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" title="The Scrum Team - tap for names and roles"
            className={cn(FOCUS, "flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground")}>
            <Users className="h-3.5 w-3.5" />
            <span className="rounded-full bg-primary/15 px-1 font-semibold text-primary">PO</span>
            <span className={cn(TONE.coach.text, "rounded-full bg-sky-500/15 px-1 font-semibold")}>SM</span>
            <span className="flex -space-x-1">
              {team.developers.map((d) => <Avatar key={d.id} name={d.name} colour={devColor(d.id, team.developers)} size={16} />)}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Scrum Team</div>
          <TeamRows team={team} onRename={onRename} />
        </PopoverContent>
      </Popover>
    );
  }
  return (
    <div className={cn(SURFACE.card, PADDING.tight, 'flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]')}>
      <span className="flex items-center gap-1 font-semibold text-muted-foreground"><Users className="h-3.5 w-3.5" /> Scrum Team</span>
      <TeamRows team={team} onRename={onRename} inline />
    </div>
  );
}

/** The three accountabilities as labelled rows (popover) or an inline run (full strip). */
function TeamRows({ team, onRename, inline = false }: { team: ScrumTeam; onRename?: (id: string, name: string) => void; inline?: boolean }) {
  return (
    <div className={cn(inline ? 'flex flex-wrap items-center gap-x-3 gap-y-1.5' : 'space-y-1.5 text-xs')}>
      <span className="flex items-center gap-1.5" title="Product Owner - accountable for the product's value; orders the Product Backlog toward the Product Goal.">
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">PO</span>
        <EditableName member={team.productOwner} onRename={onRename} className="font-medium text-foreground" />
      </span>
      <span className="flex items-center gap-1.5" title="Scrum Master - a true leader who serves the team; causes impediments to be removed and coaches self-management.">
        <span className={cn(TONE.coach.text, "rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold")}>SM</span>
        <EditableName member={team.scrumMaster} onRename={onRename} className="font-medium text-foreground" />
      </span>
      <span className="flex items-center gap-1.5" title="Developers - build the Increment; self-managing (they decide who does what) and accountable for quality via the Definition of Done.">
        <span className="text-[11px] font-semibold text-muted-foreground">Devs</span>
        <span className="flex -space-x-1">
          {team.developers.map((d) => <Avatar key={d.id} name={d.name} colour={devColor(d.id, team.developers)} />)}
        </span>
      </span>
    </div>
  );
}

/** Pick-up / swarm control for a Sprint item: shows who has picked it up, and toggles Developers
 *  on it. Self-organising - the Developers choose to pick work up; no one assigns it. More than
 *  one on an item is swarming. */
export function AssignDevs({ team, assigned, onToggle }: { team: ScrumTeam; assigned: string[]; onToggle: (devId: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Who has picked this up? (the Developers self-organise)"
          className={cn(FOCUS, "flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground")}>
          {assigned.length === 0
            ? <span>+ pick up</span>
            : <span className="flex -space-x-1">{team.developers.filter((d) => assigned.includes(d.id)).map((d) => <Avatar key={d.id} name={d.name} colour={devColor(d.id, team.developers)} size={16} />)}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Developers on this item</div>
        <div className="space-y-1">
          {team.developers.map((d) => {
            const on = assigned.includes(d.id);
            return (
              <button key={d.id} type="button" onClick={() => onToggle(d.id)}
                className={cn(FOCUS, 'flex w-full items-center gap-2 rounded-md border px-2 py-1 text-xs', on ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40')}>
                <Avatar name={d.name} colour={devColor(d.id, team.developers)} size={18} dim={!on} />
                <span className="flex-1 text-left font-medium">{d.name}</span>
                {on && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">The Developers self-organise - more than one on an item is swarming. Limit work in progress so the Developers finish together (Lean thinking).</p>
      </PopoverContent>
    </Popover>
  );
}
