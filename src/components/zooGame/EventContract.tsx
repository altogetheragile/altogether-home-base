import { Eye, Pencil, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENT_CONTRACT, ARTIFACT_NAME, type ArtifactRole } from './scrumContent';
import { TONE } from './ui/tokens';

// What an event does to the artifacts, said on the event's own page.
//
// Every event is an opportunity to inspect and adapt, and what it inspects and adapts are the
// artifacts. Saying so where the event happens is the course's "Build a Scrum" table, a row at a
// time, rather than something to memorise. The artifacts themselves live in the header's one
// Artifacts panel (see ArtifactsPanel.tsx).

const ROLE_STYLE: Record<Exclude<ArtifactRole, null>, { label: string; cls: string; Icon: typeof Eye }> = {
  inspects: { label: 'Inspecting', cls: cn(TONE.coach.text, 'bg-sky-500/15'), Icon: Eye },
  adapts: { label: 'Adapting', cls: cn(TONE.attention.text, 'bg-amber-500/15'), Icon: Pencil },
  creates: { label: 'Creating', cls: cn(TONE.done.text, 'bg-emerald-500/15'), Icon: Sparkles },
};

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
    <div className="space-y-1 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-[11px]">
      {/* Why these strips exist at all: the events are the formal chances to inspect and adapt, and
          what they inspect and adapt are the artifacts. Naming the pillars here ties the machinery
          the learner can see to the idea it serves. */}
      <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground/80">
        Inspect and adapt &middot; transparency, inspection, adaptation
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-semibold text-muted-foreground">{c.who}</span>
      {parts.map((p) => (
        <span key={p.label} className={cn('rounded-full px-1.5 py-0.5 font-semibold', p.cls)}>
          {p.label}: <span className="font-medium">{p.text}</span>
        </span>
      ))}
      {c.also && <span className="text-muted-foreground">{c.also}</span>}
      </div>
    </div>
  );
}
