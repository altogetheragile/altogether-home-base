import { useState, type ReactNode } from 'react';
import { BookOpen, X, GraduationCap, Clock, Users, Boxes, Heart, Microscope, Recycle, Repeat, Target, Hammer, HeartHandshake, ClipboardList, ListTodo, Package, CalendarRange, ClipboardCheck, Sunrise, Presentation, MessageCircleQuestion } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SCRUM_CARDS, SCRUM_INTRO, cardFor, type ScrumCard, type CardKind } from './scrumContent';

// The teaching, on screen. Three pieces: a card shown in context the first time an element is met,
// a reference panel that is always to hand, and the one-page introduction before play. All of it can
// be turned off - a learner who has just sat through the taught session should be able to play.

const KIND_LABEL: Record<CardKind, string> = {
  artifact: 'Artifact', commitment: 'Commitment', event: 'Event', accountability: 'Accountability', concept: 'Concept',
};
/** A commitment belongs to an artifact, so the label says which: "Commitment of the Product Backlog". */
const kindLabel = (c: ScrumCard) => (c.kind === 'commitment' && c.of ? `Commitment of the ${c.of}` : KIND_LABEL[c.kind]);

/** The reference, in Scrum's own shape: who the team is, what they do, what they produce, and the
 *  ideas underneath it all. */
const REFERENCE_GROUPS: [string, CardKind[]][] = [
  ['The Scrum Team', ['accountability']],
  ['The events', ['event']],
  ['The artifacts and their commitments', ['artifact', 'commitment']],
  ['The ideas underneath', ['concept']],
];

function CardBody({ card }: { card: ScrumCard }) {
  return (
    <div className="space-y-1.5 text-[11px] leading-snug">
      {([['Why', card.why], ['Who', card.who], ['When', card.when], ['How', card.how]] as const).map(([label, text]) => (
        <p key={label}><span className="font-semibold text-foreground">{label}: </span><span className="text-muted-foreground">{text}</span></p>
      ))}
      {card.timebox && (
        <p className="flex items-start gap-1 text-muted-foreground"><Clock className="mt-0.5 h-3 w-3 shrink-0" /> <span>{card.timebox}</span></p>
      )}
      {card.notScrum && <p className="text-amber-700 dark:text-amber-400">{card.notScrum}</p>}
    </div>
  );
}

/** One element, explained where the player meets it. Dismissed for good once it is read. */
export function TeachingCard({ id, onDismiss }: { id: string; onDismiss: (id: string) => void }) {
  const card = cardFor(id);
  if (!card) return null;
  return (
    <section className="rounded-lg border border-violet-300/70 bg-violet-50/60 px-3 py-2.5 dark:border-violet-800/40 dark:bg-violet-950/20">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        {/* Label above the title, not beside it: in a narrow column they were wrapping into each
            other and the card read as two competing headings. */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700 dark:text-violet-300">{kindLabel(card)}</span>
          </div>
          <h3 className="text-sm font-semibold leading-tight">{card.title}</h3>
        </div>
        <button type="button" onClick={() => onDismiss(card.id)} title="Got it" aria-label={`Got it - hide ${card.title}`}
          className="shrink-0 rounded-full p-0.5 text-violet-700/70 hover:text-violet-900 dark:text-violet-300/70 dark:hover:text-violet-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <CardBody card={card} />
    </section>
  );
}

/** Every card, always to hand, whether or not the teaching is switched on. */
export function ScrumReference({ teaching, onSetTeaching }: { teaching: boolean; onSetTeaching?: (on: boolean) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" title="Scrum reference - every element, what it is for" aria-label="Scrum reference"
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <BookOpen className="h-3.5 w-3.5" /> <span className="hidden md:inline">Scrum</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-96 overflow-y-auto">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Scrum reference</span>
          {onSetTeaching && (
            <button type="button" onClick={() => onSetTeaching(!teaching)}
              className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground">
              Teaching {teaching ? 'on' : 'off'}
            </button>
          )}
        </div>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Every element of Scrum and what it is for. Open one for why it exists, who it belongs to, when it happens and how it works.
        </p>
        {/* Grouped the way Scrum is structured, not the order the cards happen to be written in: the
            team, then what they do, then what they produce, then the ideas underneath. A flat list of
            seventeen reads as jumble however good each card is. */}
        <div className="space-y-3">
          {REFERENCE_GROUPS.map(([heading, kinds]) => (
            <section key={heading}>
              <h4 className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">{heading}</h4>
              <div className="space-y-1">
                {SCRUM_CARDS.filter((c) => kinds.includes(c.kind)).map((c) => (
                  <div key={c.id} className="rounded-md border border-border bg-card">
                    <button type="button" onClick={() => setOpen((o) => (o === c.id ? null : c.id))}
                      className="flex w-full items-start gap-2 px-2 py-1.5 text-left">
                      <span className="mt-0.5 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{kindLabel(c)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{c.title}</span>
                        {open !== c.id && <span className="block text-[11px] leading-snug text-muted-foreground">{c.summary}</span>}
                      </span>
                    </button>
                    {open === c.id && <div className="border-t border-border px-2 py-1.5"><CardBody card={c} /></div>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Each part of Scrum gets its own quiet colour and its own icon, so the page reads as four things
 *  rather than one wall - and so the same colour can mean the same thing wherever it turns up. */
const TONE = {
  founded: 'border-sky-500/25 bg-sky-500/5 text-sky-700 dark:text-sky-300',
  team: 'border-violet-500/25 bg-violet-500/5 text-violet-700 dark:text-violet-300',
  artifacts: 'border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  events: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
  values: 'border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-300',
} as const;

function Section({ title, tone, icon: Icon, children }: { title: string; tone: keyof typeof TONE; icon: typeof Users; children: ReactNode }) {
  return (
    <section className={cn('space-y-1.5 rounded-lg border p-3', TONE[tone])}>
      <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]">
        <Icon className="h-3.5 w-3.5 shrink-0" /> {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ name, note, text, icon: Icon }: { name: string; note?: string; text: string; icon?: typeof Users }) {
  return (
    <p className="flex gap-1.5 text-[12px] leading-snug text-foreground">
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />}
      <span>
        <span className="font-semibold">{name}</span>
        {note && <span className="text-muted-foreground"> ({note})</span>}
        <span className="text-muted-foreground"> - {text}</span>
      </span>
    </p>
  );
}

/** An icon per element, so the page can be scanned by shape as well as read. */
const FOUND_ICON = [Microscope, Recycle, Repeat];
const TEAM_ICON = [Target, Hammer, HeartHandshake];
const ART_ICON = [ClipboardList, ListTodo, Package];
const EVENT_ICON = [CalendarRange, ClipboardCheck, Sunrise, Presentation, MessageCircleQuestion];

/** The one page of Scrum a player meets before building anything. Skippable. */
export function ScrumOnePager({ onDone, onSkipTeaching, onBack }: { onDone: () => void; onSkipTeaching: () => void; onBack?: () => void }) {
  return (
    // The game frame never scrolls, so every screen inside it has to scroll itself - this one is
    // taller than a viewport, and without its own overflow the foot of it is simply unreachable.
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-4xl space-y-3 px-4 py-5">
      <header className="space-y-1">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-1 block text-[11px] text-muted-foreground underline-offset-2 hover:underline">
            &larr; Back
          </button>
        )}
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">Before you start</span>
        <h2 className="text-2xl font-bold leading-tight">Scrum on one page</h2>
        <p className="text-[13px] leading-snug text-muted-foreground">{SCRUM_INTRO.what}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Section title="Founded on" tone="founded" icon={Microscope}>
          {SCRUM_INTRO.foundations.map((f, i) => <Row key={f.name} name={f.name} text={f.text} icon={FOUND_ICON[i]} />)}
        </Section>
        <Section title="Three accountabilities" tone="team" icon={Users}>
          {SCRUM_INTRO.accountabilities.map((a, i) => <Row key={a.name} name={a.name} text={a.text} icon={TEAM_ICON[i]} />)}
        </Section>
        <Section title="Three artifacts, each with a commitment" tone="artifacts" icon={Boxes}>
          {SCRUM_INTRO.artifacts.map((a, i) => <Row key={a.name} name={a.name} note={a.commitment} text={a.text} icon={ART_ICON[i]} />)}
        </Section>
        <Section title="Five events" tone="events" icon={CalendarRange}>
          {SCRUM_INTRO.events.map((e, i) => <Row key={e.name} name={e.name} text={e.text} icon={EVENT_ICON[i]} />)}
        </Section>
      </div>

      <Section title="Five values" tone="values" icon={Heart}>
        <div className="flex flex-wrap gap-1.5">
          {SCRUM_INTRO.values.map((v) => (
            <span key={v.name} title={v.text} className="cursor-help rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium">{v.name}</span>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">{SCRUM_INTRO.values.map((v) => v.text).join(' ')}</p>
      </Section>

      {/* Floating, like every other primary action in the game: reachable without scrolling to the
          foot of the page, and the "turn the teaching off" escape is a real button rather than grey
          text nobody sees. */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
        <button type="button" onClick={onSkipTeaching}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
          I have covered this - turn the teaching off
        </button>
        <button type="button" onClick={onDone}
          className={cn('rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90')}>
          Start building the zoo &rarr;
        </button>
      </div>
    </div>
    </div>
  );
}
