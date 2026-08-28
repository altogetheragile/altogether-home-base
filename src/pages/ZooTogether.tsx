import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ZooLobby } from '@/components/zooGame/ZooLobby';
import { useZooSession, useSharedClock, useAiSeats } from '@/components/zooGame/useZooSession';
import { useZooSessions } from '@/components/zooGame/useZooSessions';
import type { SeatContext } from '@/components/zooGame/seatRules';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PADDING, SURFACE, TEXT } from '@/components/zooGame/ui/tokens';

// Build A Zoo, played together. The lobby seats a Scrum Team; the panel below is the seam
// where the game itself attaches - it holds a live shared game and proves the whole stack
// between two browsers, which is the thing that had to work before any of the game is
// wired to it.

function SharedGame({ gameId, sessionId, onBack }: { gameId: string; sessionId: string | null; onBack: () => void }) {
  // Which accountability this player holds, and which seats nobody is holding - the gate
  // needs both, because an empty seat's work falls to the team rather than to nobody.
  const lobby = useZooSessions(sessionId);
  const mySeat = lobby.seats.find((x) => x.participant_id === lobby.me?.id) ?? null;
  const ctx: SeatContext = {
    seat: mySeat?.seat ?? null,
    observer: lobby.me?.role === 'observer',
    emptySeats: lobby.seats.filter((x) => !x.participant_id && !x.is_ai).map((x) => x.seat),
  };
  const session = useZooSession(gameId, ctx);
  useSharedClock(session);
  // Seats with nobody in them are played by the game, so a pair can still field a whole
  // Scrum Team. What they do, they say - that is the part a solo player never gets.
  const [saidBy, setSaid] = useState<{ seat: string; says: string } | null>(null);
  const aiSeats = lobby.seats.filter((x) => x.is_ai).map((x) => x.seat);
  useAiSeats(session, aiSeats, useCallback((seat: string, says: string) => setSaid({ seat, says }), []));
  const { state, ready, present, drivesClock, error, send, refused, clearRefused } = session;

  if (error) return <p className="p-10 text-center text-sm text-destructive">{error}</p>;
  if (!ready || !state) return <p className="p-10 text-center text-sm text-muted-foreground">Joining the game…</p>;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
      <h1 className={TEXT.screen}>{state.productGoal || 'A shared zoo'}</h1>

      <div className={cn(SURFACE.card, PADDING.default, 'grid grid-cols-2 gap-3 text-sm sm:grid-cols-4')}>
        <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Phase</div><div className="font-semibold">{state.phase}</div></div>
        <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Sprint</div><div className="font-semibold">{state.sprintNumber}</div></div>
        <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Backlog</div><div className="font-semibold">{state.backlog.length}</div></div>
        <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Here</div><div className="font-semibold">{present.length}</div></div>
      </div>

      {/* Whose call it was. Shown rather than swallowed: a silent no reads as a broken
          button, and the sentence is the only thing here that teaches. */}
      {/* An AI seat doing its job, in its own words. */}
      {saidBy && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <span><strong className="capitalize">{saidBy.seat.replace('_', ' ')}</strong> (AI): {saidBy.says}</span>
          <button type="button" onClick={() => setSaid(null)} className="shrink-0 text-xs underline">ok</button>
        </div>
      )}

      {refused && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700/60 dark:bg-amber-950/30">
          <span>{refused}</span>
          <button type="button" onClick={clearRefused} className="shrink-0 text-xs underline">dismiss</button>
        </div>
      )}

      <div className={cn(SURFACE.card, PADDING.default, 'space-y-2')}>
        <p className="text-xs text-muted-foreground">
          {ctx.observer ? 'You are watching. You act on nothing.'
            : mySeat ? `You are sitting as ${mySeat.seat.replace('_', ' ')}.` : 'You hold no seat yet.'}
        </p>
        <p className="text-xs text-muted-foreground">
          {drivesClock
            ? 'This browser is driving the clock. Exactly one does, so a day is only ever ended once.'
            : 'Another browser is driving the clock.'}
        </p>
        {/* Anything typed here appears on everyone else's screen: the round trip, visible. */}
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Change the Product Goal and watch it land on the other screens"
          value={state.productGoal}
          onChange={(e) => send({ type: 'SET_PRODUCT_GOAL', goal: e.target.value })} />
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back to the lobby</Button>
        <span className="self-center text-[11px] text-muted-foreground">
          The game attaches here next: the same state, drawn by the screens that already exist.
        </span>
      </div>
    </div>
  );
}

export default function ZooTogether() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session');
  const [gameId, setGameId] = useState<string | null>(params.get('game'));

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className={TEXT.screen}>Play together</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A shared session remembers who sat where and picks up where you left it, so it needs
          you signed in. The single-player game does not.
        </p>
      </div>
    );
  }

  if (gameId) return <SharedGame gameId={gameId} sessionId={sessionId} onBack={() => { setGameId(null); }} />;

  return (
    <ZooLobby
      sessionId={sessionId}
      onEnter={(id) => {
        // The lobby hands back a session id before a game exists, and a game id after.
        if (!sessionId) setParams({ session: id });
        else { setGameId(id); setParams({ session: sessionId, game: id }); }
      }}
      onLeave={() => setParams({})}
    />
  );
}
