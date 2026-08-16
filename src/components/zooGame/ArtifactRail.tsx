import { ClipboardList, ListTodo, Package, Eye, Pencil, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ZooGameState } from './types';
import { artifactState } from './engine';
import { EVENT_CONTRACT, ARTIFACT_NAME, ARTIFACT_PROVENANCE, roleFor, type ArtifactId, type ArtifactRole } from './scrumContent';

// The three artifacts, on screen at all times.
//
// Transparency is what an artifact is for, so all three are reachable whenever they exist, whatever
// event you are in. And because every event is an opportunity to inspect and adapt, each artifact
// says what the current event is doing to it: inspecting it, adapting it, or bringing it into being.
// The learner watches the Build a Scrum table happen rather than memorising it.

const ICON: Record<ArtifactId, typeof ClipboardList> = {
  'product-backlog': ClipboardList,
  'sprint-backlog': ListTodo,
  increment: Package,
};

const ROLE_STYLE: Record<Exclude<ArtifactRole, null>, { label: string; cls: string; Icon: typeof Eye }> = {
  inspects: { label: 'Inspecting', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', Icon: Eye },
  adapts: { label: 'Adapting', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', Icon: Pencil },
  creates: { label: 'Creating', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', Icon: Sparkles },
};

export function ArtifactRail({ state }: { state: ZooGameState }) {
  const artifacts = artifactState(state);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {artifacts.map((a) => {
        const Icon = ICON[a.id];
        const role = roleFor(state.phase, a.id);
        const rs = role ? ROLE_STYLE[role] : null;
        const prov = ARTIFACT_PROVENANCE[a.id];
        return (
          <Popover key={a.id}>
            <PopoverTrigger asChild>
              <button type="button"
                title={`${ARTIFACT_NAME[a.id]} - ${a.exists ? a.summary : 'does not exist yet'}`}
                className={cn('flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-medium transition-colors',
                  a.exists ? 'border-border bg-background text-foreground hover:bg-muted/50' : 'border-dashed border-border/70 text-muted-foreground/70')}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xl:inline">{ARTIFACT_NAME[a.id]}</span>
                {rs && (
                  <span className={cn('rounded-full px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide', rs.cls)}>
                    <rs.Icon className="inline h-2.5 w-2.5" /> <span className="hidden lg:inline">{rs.label}</span>
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{ARTIFACT_NAME[a.id]}</span>
                  {!a.exists && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">not yet</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">{a.summary}</p>
                <div className={cn('rounded-md border px-2 py-1.5', a.commitmentMet ? 'border-primary/30 bg-primary/5' : 'border-dashed border-border')}>
                  <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-primary">Commitment &middot; {prov.commitment}</div>
                  <p className="text-[11px] font-medium">{a.commitment}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">{a.exists ? prov.changes : prov.born}</p>
                {rs && (
                  <p className={cn('rounded-md px-2 py-1 text-[11px] font-medium', rs.cls)}>
                    {EVENT_CONTRACT[state.phase]?.event} is {rs.label.toLowerCase()} it right now.
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

/** What this event inspects and what it adapts, said on the event's own page. */
export function EventContractStrip({ phase }: { phase: string }) {
  const c = EVENT_CONTRACT[phase];
  if (!c) return null;
  const names = (ids: string[]) => ids.map((i) => ARTIFACT_NAME[i] ?? i).join(' and ');
  const parts: { label: string; text: string; cls: string }[] = [];
  if (c.inspects.length) parts.push({ label: 'Inspecting', text: names(c.inspects), cls: ROLE_STYLE.inspects.cls });
  if (c.adapts.length) parts.push({ label: 'Adapting', text: names(c.adapts), cls: ROLE_STYLE.adapts.cls });
  if (c.creates.length) parts.push({ label: 'Creating', text: names(c.creates), cls: ROLE_STYLE.creates.cls });
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-[11px]">
      <span className="font-semibold text-muted-foreground">{c.who}</span>
      {parts.map((p) => (
        <span key={p.label} className={cn('rounded-full px-1.5 py-0.5 font-semibold', p.cls)}>
          {p.label}: <span className="font-medium">{p.text}</span>
        </span>
      ))}
      {c.also && <span className="text-muted-foreground">{c.also}</span>}
    </div>
  );
}
