import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ZooLobby } from '@/components/zooGame/ZooLobby';
import { ZooGameScreens } from './ZooGame';
import { TrainerDeck } from '@/components/zooGame/TrainerDeck';
import { useZooSession, useSharedClock, useAiSeats } from '@/components/zooGame/useZooSession';
import { useZooSessions } from '@/components/zooGame/useZooSessions';
import { seatIsAway, unmannedSeats } from '@/components/zooGame/seatPresence';
import type { SeatContext } from '@/components/zooGame/seatRules';
import { useAuth } from '@/contexts/AuthContext';
import { TEXT } from '@/components/zooGame/ui/tokens';
import { Button } from '@/components/ui/button';

/** How long a line from a seat played by the game stays on the rail. Long enough to move to
 *  another topic and still read what happened while you were away; short enough that the
 *  Sprint board is not permanently under a stack of them. */
// How long a line from a seat stays up. Twenty-five seconds meant several were always on screen at
// once during a Sprint; at eight, one is read and gone before the next arrives.
const SAY_SECONDS = 8;

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
    // A trainer: granted by the host, never implied by hosting. See `TRAINER_ONLY`.
    facilitator: !!lobby.me?.can_facilitate,
    // ...and which team member this player is. Every player is a Developer of their own, so this is
    // their participant id whatever seat they hold; a watcher is not on the team.
    memberId: lobby.me && lobby.me.role !== 'observer' ? lobby.me.id : undefined,
    // Seats with nobody in them - which includes a seat whose holder has shut their laptop. It used
    // to mean "no participant and no AI", so a held-but-absent seat read as staffed and its work
    // fell to nobody: the Sprint waited on somebody who had gone home, and nothing said so.
    emptySeats: unmannedSeats(lobby.seats, lobby.participants, lobby.present),
  };
  // Seats somebody is still holding and is not here for. The lobby has said this from the start -
  // an amber "away" against the name - and in the game it was only a seat that had quietly become
  // yours to cover. Covered because nobody took it and covered because whoever took it has shut
  // their laptop are different things to a room full of people: one is a seat to fill, the other
  // is somebody to check on.
  //
  // By seat for the Product Owner, and by person for everybody, since each player is a Developer of
  // their own: one of them shutting their laptop is not the whole team away.
  const awayHolders = lobby.seats.filter((x) => seatIsAway(x, lobby.participants, lobby.present));
  const awaySeats = [
    ...awayHolders.filter((x) => x.seat !== 'developer').map((x) => x.seat as string),
    ...awayHolders.map((x) => x.participant_id!),
  ];
  const session = useZooSession(gameId, ctx);
  useSharedClock(session);
  // Seats with nobody in them are played by the game, so a pair can still field a whole
  // Scrum Team. What they do, they say - that is the part a solo player never gets.
  //
  // Kept as a short history rather than one line replaced by the next. They act on their own
  // beat, several moves inside a few seconds, and the most consequential thing they say - what
  // they forecast, and why - used to be overwritten before you had walked to the topic that
  // shows it. Four is what fits the rail; the oldest falls off.
  //
  // Each line then goes quiet on its own. The rail floats over the screen, and during a Sprint
  // the board is the full width of it, so a history that never cleared would sit permanently
  // on top of the park it is describing.
  const [saidBy, setSaid] = useState<{ id: number; seat: string; says: string; kind: string; also: number; where: string }[]>([]);
  const nextId = useRef(0);
  const top = useRef<{ id: number; seat: string; kind: string } | null>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const forget = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setSaid((prev) => prev.filter((x) => x.id !== id));
  }, []);
  useEffect(() => {
    const running = timers.current;
    return () => { for (const t of running.values()) clearTimeout(t); running.clear(); };
  }, []);

  // Which screen the team is on. Commentary belongs to the moment it was said: four notes about
  // agreeing the Sprint Goal were still sitting in the rail at topic three, describing a
  // conversation two screens ago.
  const here = (s: typeof session.state, topic?: string) => (!s ? ''
    : s.phase === 'planning' ? `planning:${topic ?? s.planningTopic ?? 'why'}` : s.phase);
  const whereRef = useRef('');
  useEffect(() => { whereRef.current = here(session.state); });

  // The seats the game plays: never the Developers. The team is the people at the table, and the
  // game builds nothing - "The AI building is just too clunky. Let a player take all the roles."
  // Nor the Scrum Master once a player wears the hat: the seat has retired, and its work is theirs.
  const hat = !!session.state?.scrumMasterId;
  const aiSeats = lobby.seats
    .filter((x) => x.is_ai && x.seat !== 'developer' && !(hat && x.seat === 'scrum_master'))
    .map((x) => x.seat);
  // The same list the Sprint Goal panel waits on, so the seats played by the game hold topic one
  // open exactly as long as the screen does.
  //
  // Once the players are on the team, each of them agrees for themselves - a Product Owner who is
  // a person included, since they are one of the players. The only seat still waited on is one the
  // game plays, which can only be the Product Owner's.
  const people = (session.state?.team.developers ?? []).filter((d) => d.player).map((d) => d.id);
  const mustAgree = people.length > 0
    ? [...aiSeats.filter((x) => x === 'product_owner'), ...people]
    : [...new Set(lobby.seats
      .filter((x) => (x.participant_id || x.is_ai) && !(hat && x.seat === 'scrum_master'))
      .map((x) => x.seat))];
  useAiSeats(session, aiSeats, { mustAgree, onSay: useCallback((seat: string, says: string, action: { type: string; topic?: string }) => {
    const kind = action.type;
    // A move that changes the topic is about the topic it moves TO, or the line announcing
    // topic three would be filed under topic two and swept away on arrival.
    const where = kind === 'SET_PLANNING_TOPIC' ? `planning:${action.topic}` : whereRef.current;
    // The same seat doing the same kind of thing again takes the slot it already has,
    // counting up. Planning the steps for five items is one piece of news; letting each one
    // have a slot pushed the forecast - the line that explains the whole screen - off the
    // rail before you had walked to the topic that shows it.
    const same = top.current && top.current.seat === seat && top.current.kind === kind;
    const id = same ? top.current!.id : nextId.current++;
    top.current = { id, seat, kind };
    setSaid((prev) => (same && prev[0]?.id === id
      ? [{ ...prev[0], says, also: prev[0].also + 1 }, ...prev.slice(1)]
      // Two at a time. Four was "too much to follow", and on a Sprint with every seat played by
      // the game it was four cards over the park. What a seat did is commentary; the record is the
      // decision log at the Retrospective.
      : [{ id, seat, says, kind, also: 0, where }, ...prev.filter((x) => x.id !== id)].slice(0, 2)));
    // A repeat renews its own slot rather than dying on the first one's clock.
    const running = timers.current.get(id);
    if (running) clearTimeout(running);
    timers.current.set(id, setTimeout(() => forget(id), SAY_SECONDS * 1000));
  }, [forget]) });
  const { state, ready, present, drivesClock, error, refused, clearRefused } = session;

  // Arriving is joining the team, under the name you gave the lobby. Sent once the game has loaded,
  // and harmless again: somebody who reconnects is already on it.
  const joined = !!state && !!ctx.memberId && state.team.developers.some((d) => d.id === ctx.memberId);
  const { send } = session;
  const myName = lobby.me?.display_name;
  useEffect(() => {
    if (ready && state && ctx.memberId && !joined) send({ type: 'JOIN_TEAM', id: ctx.memberId, name: myName ?? 'Player' });
  }, [ready, state, ctx.memberId, joined, myName, send]);

  if (error) return <p className="p-10 text-center text-sm text-destructive">{error}</p>;
  if (!ready || !state) return <p className="p-10 text-center text-sm text-muted-foreground">Joining the game…</p>;

  return (
    <div className="relative">
      {/* The game itself. The same screens the solo game uses - the only difference is which
          carrier the actions were built around, which is the whole point of one surface. */}
      <ZooGameScreens game={{ ...session, state }} saves={false}
        seat={mySeat?.seat ?? null} observer={ctx.observer}
        covering={ctx.emptySeats} away={awaySeats}
        said={saidBy.filter((m) => m.where === here(state))} onDismissSaid={forget}
        refused={refused} onDismissRefused={clearRefused}
        // Every accountability with somebody in it - a person or an AI - has to agree the
        // Sprint Goal. Empty seats cannot agree, so they are not waited on.
        mustAgree={mustAgree} you={ctx.memberId ?? null} />

      {/* The trainer's hand, for the trainer only. */}
      {ctx.facilitator && <TrainerDeck state={state} onPlay={session.playTrainerCard} onSetLed={session.setTrainerLed} />}

      <div className="flex items-center justify-between gap-3 px-4 py-3 text-[11px] text-muted-foreground">
        <span>
          {ctx.observer ? 'Watching this team. You act on nothing.'
            : mySeat ? `You are sitting as ${mySeat.seat.replace('_', ' ')}.` : 'You hold no seat.'}
          {' '}{present.length} here{drivesClock ? ' \u00b7 this browser is keeping time' : ''}
        </span>
        <button type="button" onClick={onBack} className="underline">Back to the lobby</button>
      </div>
    </div>
  );
}

export default function ZooTogether() {
  const { user } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const sessionId = params.get('session');
  const [gameId, setGameId] = useState<string | null>(params.get('game'));

  if (!user) {
    // A reason and no door. This screen explained why it needs you signed in and then offered
    // nothing to press: somebody following a link to their trainer's session arrived at a closed
    // page with the site header gone, and the only way on was to guess a URL. Two ways out - in,
    // and back - and signing in returns to the session rather than to the home page, because the
    // link somebody sent you is the thing you were trying to open.
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className={TEXT.screen}>Play together</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A shared session remembers who sat where and picks up where you left it, so it needs
          you signed in. The single-player game does not.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link to="/auth" onClick={() => {
              sessionStorage.setItem('auth:returnTo', `${location.pathname}${location.search}`);
            }}>Sign in and carry on</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/zoo-game">Play on your own instead</Link>
          </Button>
        </div>
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
