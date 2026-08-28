import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Bot, Eye, Check, Copy, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useZooSessions, type Seat, type Participant, type SeatName } from './useZooSessions';
import { PADDING, SURFACE, TEXT, FOCUS } from './ui/tokens';

// The table before the game starts: who is here, and who is sitting where.
//
// It is a Scrum Team being formed, so it shows the accountabilities rather than a list of
// players. The seats are the teaching: one Product Owner, one Scrum Master, Developers, and
// no way to hold two at once. What nobody claims is played by AI, so a pair can still field
// a whole team - which is what makes this reach a solo learner as well as a class.

const SEAT_LABEL: Record<SeatName, string> = {
  product_owner: 'Product Owner',
  scrum_master: 'Scrum Master',
  developer: 'Developer',
};
const SEAT_WHY: Record<SeatName, string> = {
  product_owner: 'Accountable for maximising value. Orders the Product Backlog and writes the goals.',
  scrum_master: 'Accountable for Scrum being understood and enacted, and for the team’s effectiveness.',
  developer: 'Accountable for creating a usable Increment each Sprint.',
};

function SeatCard({ seat, holder, mine, canAct, onClaim, onLeave, onAi }: {
  seat: Seat; holder: Participant | null; mine: boolean; canAct: boolean;
  onClaim: () => void; onLeave: () => void; onAi: (on: boolean) => void;
}) {
  const taken = !!holder || seat.is_ai;
  return (
    <div className={cn(SURFACE.card, PADDING.default, 'flex flex-col gap-2',
      mine && 'border-primary ring-1 ring-primary/30')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{SEAT_LABEL[seat.seat]}</span>
        {seat.is_ai && <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"><Bot className="h-3 w-3" /> AI</span>}
        {mine && <span className="flex items-center gap-1 text-[11px] font-medium text-primary"><Check className="h-3 w-3" /> you</span>}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">{SEAT_WHY[seat.seat]}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="truncate text-xs text-muted-foreground">
          {holder ? holder.display_name : seat.is_ai ? 'played by AI' : 'empty'}
        </span>
        {canAct && (mine
          ? <Button size="sm" variant="ghost" onClick={onLeave}>Leave</Button>
          : !taken
            ? <div className="flex gap-1">
                <Button size="sm" onClick={onClaim}>Sit here</Button>
                <Button size="sm" variant="ghost" onClick={() => onAi(true)} title="Let AI play this accountability">AI</Button>
              </div>
            : seat.is_ai
              ? <div className="flex gap-1">
                  <Button size="sm" onClick={onClaim}>Take it</Button>
                  <Button size="sm" variant="ghost" onClick={() => onAi(false)}>Clear</Button>
                </div>
              : null)}
      </div>
    </div>
  );
}

/** Opening a session, or joining one. */
function Doorway({ onCreated, onJoined }: { onCreated: (id: string) => void; onJoined: (id: string) => void }) {
  const { createSession, joinByCode, busy, error } = useZooSessions(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  return (
    <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-10">
      <div className="space-y-1 text-center">
        <h1 className={TEXT.screen}>Play together</h1>
        <p className="text-sm text-muted-foreground">
          One zoo, one Scrum Team, several people. Seats are the accountabilities, and whatever
          nobody takes is played by AI.
        </p>
      </div>

      <div className={cn(SURFACE.card, PADDING.default, 'space-y-2')}>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start a session</div>
        <Input placeholder="What is this session called?" value={name} onChange={(e) => setName(e.target.value)} />
        <Button disabled={busy || !name.trim()} onClick={async () => { const id = await createSession(name.trim()); if (id) onCreated(id); }}>
          Open a session
        </Button>
        <p className="text-[11px] text-muted-foreground">You get a code to give to the others. It keeps working tomorrow.</p>
      </div>

      <div className={cn(SURFACE.card, PADDING.default, 'space-y-2')}>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Join a session</div>
        <Input placeholder="Six-letter code" value={code} maxLength={6}
          onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-mono tracking-[0.2em]" />
        <Button variant="outline" disabled={busy || code.trim().length < 4}
          onClick={async () => { const id = await joinByCode(code); if (id) onJoined(id); }}>
          Join
        </Button>
      </div>

      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ZooLobby({ sessionId, onEnter, onLeave }: {
  sessionId: string | null; onEnter: (gameId: string) => void; onLeave: () => void;
}) {
  const s = useZooSessions(sessionId);
  const [copied, setCopied] = useState(false);
  if (!sessionId) return <Doorway onCreated={onEnter as unknown as (id: string) => void} onJoined={onEnter as unknown as (id: string) => void} />;
  if (!s.session) return <p className="p-10 text-center text-sm text-muted-foreground">Opening the session…</p>;

  const holderOf = (seat: Seat) => s.participants.find((p) => p.id === seat.participant_id) ?? null;
  const seated = s.seats.some((x) => x.participant_id === s.me?.id);
  const observing = s.me?.role === 'observer';
  const byKind = (k: SeatName) => s.seats.filter((x) => x.seat === k).sort((a, b) => a.seat_no - b.seat_no);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={TEXT.screen}>{s.session.name}</h1>
          <p className="text-sm text-muted-foreground">{s.participants.length} here · {s.session.status}</p>
        </div>
        <button type="button" title="Read this out, or send it"
          onClick={() => { void navigator.clipboard?.writeText(s.session!.join_code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className={cn(FOCUS, 'flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2')}>
          <span className="font-mono text-xl font-bold tracking-[0.25em]">{s.session.join_code}</span>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      {!s.gameId ? (
        <div className={cn(SURFACE.card, PADDING.default, 'space-y-3 text-center')}>
          <p className="text-sm text-muted-foreground">
            {s.isHost ? 'Lay out the table when everyone is here.' : 'Waiting for the host to lay out the table.'}
          </p>
          {s.isHost && <Button disabled={s.busy} onClick={() => void s.startGame()}><Play className="mr-1.5 h-4 w-4" /> Set up the game</Button>}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">The Scrum Team</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(['product_owner', 'scrum_master', 'developer'] as SeatName[]).flatMap((k) =>
                byKind(k).map((seat) => (
                  <SeatCard key={seat.id} seat={seat} holder={holderOf(seat)}
                    mine={seat.participant_id === s.me?.id} canAct={!observing}
                    onClaim={() => void s.claimSeat(seat.id)}
                    onLeave={() => void s.leaveSeat(seat.id)}
                    onAi={(on) => void s.fillWithAi(seat.id, on)} />
                )))}
            </div>
          </div>

          <div className={cn(SURFACE.card, PADDING.default, 'flex flex-wrap items-center justify-between gap-3')}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {observing
                ? 'Watching. You hold no seat and act on nothing, which is how a trainer joins a team they are coaching.'
                : 'Playing. Switch to watching to coach without taking a seat.'}
            </div>
            <Button size="sm" variant="ghost" onClick={() => void s.setRole(observing ? 'player' : 'observer')}>
              {observing ? 'Take a seat instead' : 'Watch instead'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {s.participants.map((p) => p.display_name).join(', ') || 'nobody yet'}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onLeave}>Back</Button>
              <Button disabled={!seated && !observing} onClick={() => s.gameId && onEnter(s.gameId)}
                title={!seated && !observing ? 'Take a seat, or switch to watching' : undefined}>
                Enter the zoo →
              </Button>
            </div>
          </div>
        </>
      )}

      {s.error && <p className="text-center text-xs text-destructive">{s.error}</p>}
    </div>
  );
}
