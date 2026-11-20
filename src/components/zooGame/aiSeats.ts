import type { ZooGameState, ZooAction } from './types';
import type { SeatName } from './useZooSessions';
import { notReady, cannotOpenGround, PLACEMENT_CHOICES, readyToOpen, goalSource, suggestSprintGoal, acToJudge, acFailing } from './engine';
import { lookAhead } from './lookAhead';
import { DEFAULT_BRIEF } from './config';
import { poLooksAt } from './parkChecks';
import { whatToFix } from './nextFix';

import { plotOrder } from './parkZones';

// A seat nobody is sitting in, played by the game.
//
// Only the Product Owner, and the Scrum Master seat while it still exists. Never the Developers: the
// game builds nothing, sizes nothing and forecasts nothing. Every Developer is a person at the
// table, and alone that person is you (Al, 29 Oct 2026: "The AI building is just too clunky. Let a
// player take all the roles - Dev, SM and PO."). See docs/ZOO_EVERYONE_A_DEVELOPER.md.
//
// None of this needs a language model. The seat applies its accountability to what the game already
// knows, so it stays deterministic (a trainer can replay a seed), costs nothing and answers at once.
// The Product Owner's ordering of the Product Backlog has its own edge function (`zoo-po-refine`),
// left where it is so a session can run with no network at all.

export interface AiMove {
  action: ZooAction;
  /** What the seat says. The point is not the move, it is that somebody in that
   *  accountability tells you why - which is the thing a solo player never gets. */
  says: string;
}

/** Every accountability, which is who has to agree a Sprint Goal unless a caller says otherwise. */
const ALL_SEATS: SeatName[] = ['product_owner', 'scrum_master', 'developer'];

/** The seats the game plays when one person is playing alone.
 *
 *  The Product Owner, and nobody else yet.
 *
 *  Not the DEVELOPERS: that is the seat the player holds while the Sprint Backlog is being
 *  executed. "Watching AI agents build things as Devs is not fun for a human PO."
 *
 *  Not the SCRUM MASTER either, for a sharper reason. The clearest thing that seat does here is
 *  hold the Daily Scrum - and the Daily Scrum is the DEVELOPERS' event, which the player is now
 *  sitting in. A Scrum Master played by the game would hold it a few seconds after it opened and
 *  the player would never get to decide anything in it: not what to do about what surfaced, not
 *  whether to say "we're done" early, not whether to skip it and pay for it. That is the one event
 *  this game has spent the most care on.
 *
 *  So the Scrum Master waits until there is something for them to do that is not taking the
 *  player's own event away from them. */
export const SOLO_AI_SEATS: SeatName[] = ['product_owner'];

/** What the seat played by the game must NOT do while somebody is sitting at the table.
 *
 *  Accepting work is a decision, and it is one of the few the player is here to make. Played for
 *  them it simply happened: a card was built and approved before anybody had looked at it, which
 *  is the opposite of the lesson - "the PO automatically approved a built card. I'd prefer to keep
 *  the decision action using the message centre."
 *
 *  So the sign-off and the criteria stay in the rail, where the game asks the player for things.
 *  Answering HOW it gets built is not on this list, because handing that back is itself the
 *  teaching and the player is on the receiving end of it.
 *
 *  Only when a player is there. In a shared session with nobody in the Product Owner's seat the
 *  game still has to accept, or work builds up against a sign-off that is never coming. An empty
 *  chair is not the same as somebody choosing not to decide yet. */
// ...and calling the Sprint Goal, for the same reason: "How is the Sprint Goal not met?" was a
// verdict the game handed down. Alone, the player calls it in Priya's name, at the Review.
//
// All of that was reversed on 18 Nov 2026: "Let the game act as Priya on all PO decisions - it gets
// confusing." Alone, the player is the Scrum Master and the Developers, and a card marked "Your
// move - Product Owner" asked them to be the one seat they are not. Priya now accepts, signs off,
// calls the Sprint Goal and opens Done work herself, and says why in the thread. What stays with
// the team is agreeing the Sprint Goal she suggests. Nothing is left to the player any more, so
// `leftToThePlayer` is gone; ZooGame still holds her starter Backlog until the team has met.

/** What this AI accountability would do now, or nothing if it is not their turn.
 *
 *  `mustAgree` is who still has to agree the Sprint Goal before topic two can begin - the same
 *  list the screen waits on. It is passed in rather than assumed because a seat nobody is holding
 *  and no AI is playing cannot agree to anything, and the Developers would wait on it forever. */
export function aiTurn(state: ZooGameState, seat: SeatName, mustAgree: readonly string[] = ALL_SEATS): AiMove | null {
  // Topic one before topic two, for the seats played by the game as much as for anybody.
  //
  // They used to select and plan against a Sprint Goal that had only been PROPOSED: the Product
  // Owner wrote it, the Developers agreed with themselves, and off they went - so a Product Owner
  // still reading it was told the work had been chosen and the steps written for it, on a screen
  // that said nothing was forecast yet. Agreeing the Goal is what topic one is; work chosen
  // before it is work chosen against nothing.
  const goalAgreed = mustAgree.every((s) => state.sprintGoalAgreed.includes(s));
  const topic = state.planningTopic ?? 'why';
  // Never the Developers. The game builds nothing: every Developer is a person at the table, and
  // alone that person is you. "The AI building is just too clunky. Let a player take all the roles."
  if (seat === 'developer') return null;

  if (seat === 'scrum_master') {
    // "Ensure that all Scrum events take place." The Daily Scrum is the one the game lets
    // you skip, and skipping it is what lets a blocker grow overnight - so the Scrum Master
    // holding it is the clearest thing this accountability actually does here.
    if (state.phase === 'planning' && state.sprintGoal.trim()
        && !state.sprintGoalAgreed.includes('scrum_master')) {
      return { action: { type: 'AGREE_SPRINT_GOAL', seat: 'scrum_master' },
               says: 'Agreed. It says why the Sprint is valuable, which is what it is for.' };
    }
    // "Ensure that all Scrum events take place." Sprint Planning is one event with three topics
    // in an order, and somebody has to move the agenda on - otherwise a team of seats played by
    // the game sits on topic one forever waiting to be told.
    //
    // Each of these fires once and only forwards: once there is a forecast the first cannot fire
    // again, and once there are steps the second cannot. So a Product Owner who walks back to
    // topic one to re-read the Goal is left there rather than being dragged forward again.
    if (state.phase === 'planning' && goalAgreed && topic === 'why' && state.forecast.length === 0) {
      return { action: { type: 'SET_PLANNING_TOPIC', topic: 'what' },
               says: 'The Goal is agreed, so that is topic one. What can we finish this Sprint?' };
    }
    if (state.phase === 'planning' && topic === 'what' && state.forecast.length > 0
        && !state.backlog.some((it) => state.forecast.includes(it.id) && (it.tasks ?? []).some((t) => t.label.trim()))) {
      return { action: { type: 'SET_PLANNING_TOPIC', topic: 'how' },
               says: 'We have what. Topic three is how it gets done.' };
    }
    if (state.phase === 'sprint' && state.dayStage === 'dailyScrum') {
      return { action: { type: 'RUN_DAILY_SCRUM' },
               says: state.pendingImpediment
                 ? 'We hold the Daily Scrum and adapt around the blocker. Left alone it grows overnight.'
                 : 'We hold the Daily Scrum. The event is how the team knows where it is.' };
    }
    return null;
  }

  // Before there is a Product Backlog at all. Writing one is the Product Owner's - which is the
  // whole point of making the Scrum Team write it rather than handing them one - so a team whose
  // Product Owner seat is played by the game would sit on the three questions for ever. Reported
  // from a live session joined as a Developer: the screen offered a button that was refused, and
  // there was no other way on.
  // ...and written to her Product Goal: the area it starts with goes first. Before, the starter was
  // the same whatever the Goal said, so a Goal about the water got Big Cats on top.
  if (state.phase === 'brief') {
    const first = state.goalFocus && DEFAULT_BRIEF.zones.includes(state.goalFocus) ? state.goalFocus : DEFAULT_BRIEF.firstZone;
    return { action: { type: 'WRITE_BACKLOG', brief: { ...DEFAULT_BRIEF, firstZone: first } },
             says: state.goalFocus
               ? `Here is what I want us to build, for the Product Goal: ${DEFAULT_BRIEF.zones.length} areas for families, and we open ${first} first.`
               : `Here is what I want us to build: ${DEFAULT_BRIEF.zones.length} areas for families, and we open ${first} first.` };
  }

  // Growing the zoo: the biggest ordering decision there is, and this seat's to make. Only when the
  // zoo can afford it AND there is work waiting on that ground - buying a field nobody has anything
  // to put in is what a Product Owner does when they are optimising for having spent the money.
  const growable = plotOrder(state)
    .filter((z) => !cannotOpenGround(state, z))
    .find((z) => state.backlog.some((it) => it.zone === z && it.status === 'backlog' && it.category !== 'epic'));
  if (growable) {
    return { action: { type: 'OPEN_GROUND', zone: growable },
             says: `We have earned the ${growable}. Opening the ground for it out of what the zoo is worth - that is what being worth visiting buys us.` };
  }

  // Product Owner. A Sprint Goal to start from, once a Sprint: the Guide has the Product Owner
  // propose how the product could increase its value, and the whole Scrum Team define the Goal. So
  // she offers words and the team agrees them, changes them or writes its own - and once offered
  // she does not fill the box again if they clear it.
  if (state.phase === 'planning' && (state.planningTopic ?? 'why') === 'why' && !state.sprintGoal.trim()
      && state.sprintGoalSuggestedIn !== state.sprintNumber) {
    const goal = suggestSprintGoal(goalSource(state));
    return { action: { type: 'SET_SPRINT_GOAL', goal, suggested: true },
             says: 'Here is the Sprint Goal I would propose. It is the whole team\u2019s to agree, so change it if it does not say why this Sprint is worth doing.' };
  }
  // They proposed it, so they are in - but it is still the team's to agree.
  if (state.phase === 'planning' && state.sprintGoal.trim()
      && !state.sprintGoalAgreed.includes('product_owner')) {
    return { action: { type: 'AGREE_SPRINT_GOAL', seat: 'product_owner' },
             says: 'That is the value I am proposing this Sprint.' };
  }
  // Answering the Developers when they ask where something goes. It is a product decision - what
  // a visitor meets first, and in what order - so it belongs in this seat, and a game where every
  // seat is played would otherwise sit waiting for an answer nobody was there to give.
  if (state.pendingPlacement) {
    const item = state.backlog.find((it) => it.id === state.pendingPlacement!.itemId);
    if (item) {
      // The first thing goes where people come in, and the zoo fills up from there. Deterministic,
      // because a trainer replaying a seed has to get the same zoo.
      const placed = state.backlog.filter((it) => it.pos).length;
      const choice = PLACEMENT_CHOICES[Math.min(placed, PLACEMENT_CHOICES.length - 1)];
      return { action: { type: 'ANSWER_PLACEMENT', id: item.id, choice: choice.key },
               says: `${choice.label} for ${item.name} - that is where I want people to meet it.` };
    }
  }

  // A trainer's card, which lands on this seat: what happens to the Sprint is the Product Owner's.
  // The card says what a Product Owner played by the game would choose, and the seat says why -
  // the debrief has something to argue with.
  const card = (state.questions ?? []).find((q) => q.id.startsWith('card-') && q.card);
  if (card?.card) {
    return { action: { type: 'ANSWER_QUESTION', id: card.id, choice: card.card.aiChoice ?? 'now', by: 'product_owner' },
             says: card.card.aiSays || 'We deal with it this Sprint, and the Sprint Goal stands.' };
  }

  // Coming to look at finished work. The sign-off is this seat's answer now, not something that
  // follows from the criteria on its own - so with nobody sitting here, work whose every criterion
  // is a fact would build itself and then wait for ever.
  //
  // She looks before she answers. Where the park shows something about a criterion that is hers to
  // judge - can I walk right round it? - she goes and sees, and says no when it is not so. Saying
  // yes without looking taught that acceptance is a rubber stamp: in a playtest she said "I can
  // walk right round it" about an enclosure she had not been near.
  const asked = (state.questions ?? []).find((q) => q.id.startsWith('check-'));
  if (asked?.itemId) {
    const item = state.backlog.find((it) => it.id === asked.itemId);
    const name = item?.name ?? 'it';
    // First what the park itself says. She used to answer "accept" whatever it said - not even one of
    // the answers on offer when something fails - and in the sm6 playtest she signed off a lion
    // enclosure behind a 2m fence the park had just said a lion would be over.
    const fails = item ? whatToFix(state, item) : null;
    if (fails) {
      const where = fails.where && !/\bunder\b/i.test(fails.evidence) ? ` It is under ${fails.where}.` : '';
      return { action: { type: 'ANSWER_QUESTION', id: asked.id, choice: 'back', by: 'product_owner' },
               says: `Not yet. I went to look at the ${name}, and the park says ${fails.evidence}.${where} Fix that, then ask me again.` };
    }
    const seen = item ? acToJudge(item).map((label) => ({ label, look: poLooksAt(state, item, label) })) : [];
    const no = seen.find((x) => x.look && !x.look.met);
    if (no && item && !acFailing(item).length) {
      return { action: { type: 'ANSWER_QUESTION', id: asked.id, choice: 'back', by: 'product_owner' },
               says: `Not yet. I went to look at the ${name}, and ${no.label.replace(/^Can I /, 'I cannot ').replace(/\?$/, '')}: ${no.look!.evidence}, then ask me again.` };
    }
    const looked = seen.find((x) => x.look?.met);
    return { action: { type: 'ANSWER_QUESTION', id: asked.id, choice: 'accept', by: 'product_owner' },
             says: looked
               ? `I have looked at ${name}: ${looked.label.replace(/^Can I /, 'I can ').replace(/\?$/, '')}. That is what I asked for.`
               : `I have looked at ${name}. That is what I asked for.` };
  }

  // A question about HOW the work gets built, handed straight back.
  //
  // This is the seat's sharpest teaching and it only lands from the other side of it. The
  // Developers ask "rounded or square?"; what and why are the Product Owner's, how is theirs, and
  // the right answer is to say so. A player sitting in the Developers' seat learns it by being
  // handed their own decision back, which is worth more than being told not to answer it.
  //
  // Found by the choice the question itself offers - the question knows which of its answers is
  // the one that keeps the decision where it belongs - rather than by matching on its wording.
  const theirs = (state.questions ?? []).find((q) => q.of === 'product_owner'
    && (q.choices ?? []).some((c) => c.key === 'theirs'));
  if (theirs) {
    return { action: { type: 'ANSWER_QUESTION', id: theirs.id, choice: 'theirs', by: 'product_owner' },
             says: 'Your call. How it gets built is yours - I care what it has to do.' };
  }

  // She does not tick criteria nobody has asked her about. She used to go down every card in the
  // Sprint saying yes to the ones that are hers, unasked and unlooked - which is the Developers'
  // "Ask Priya to check it" with the asking taken out. She judges them when they ask, above.

  // Done and shut: releasing is this seat's call, and she makes it at once. Value only counts once
  // visitors can use it, and the Guide is clear that the Review is not a gate to releasing it.
  const shut = state.backlog.find((it) => it.status === 'done' && readyToOpen(it));
  if (shut && (state.phase === 'sprint' || state.phase === 'review')) {
    return { action: { type: 'OPEN_ITEM', id: shut.id, by: 'product_owner' },
             says: `${shut.name} is Done. I am opening it to visitors now: it is worth nothing to them shut.` };
  }

  // Her own look-ahead: a need the zoo will have before the visitors say so, or a facility buried
  // in an epic where nobody can size it. She raised it, so she acts on it rather than putting it to
  // the team as a question that was never theirs.
  // During the Sprint only, where the rail used to put these to the player. Earlier, a facility
  // split out of an epic lands at the top of the Product Backlog just as she is pointing the team
  // at where the value is.
  if (state.phase === 'sprint') {
    const p = lookAhead(state)[0];
    if (p?.kind === 'add' && p.draft) {
      return { action: { type: 'ADD_PBI', draft: p.draft },
               says: `${p.why} I am putting "${p.label}" on the Product Backlog.` };
    }
    if (p?.kind === 'split' && p.epicId && p.memberIds) {
      return { action: { type: 'SPLIT_EPIC', id: p.epicId, memberIds: p.memberIds },
               says: `${p.why} I am splitting it out so it can be sized.` };
    }
  }

  // What the visitors asked for becomes a Product Backlog item when they decide it does, which is
  // the value call the Review exists to produce.
  if (state.phase === 'review' && state.signals.length > 0) {
    return { action: { type: 'ACCEPT_SIGNAL', index: 0 },
             says: `Visitors asked for this. I am putting it on the Product Backlog: ${state.signals[0].suggestion}.` };
  }
  // The Sprint Goal, called on what the game can read when nobody is in this seat to call it: the
  // essentials, or with none marked, everything forecast. A player at the table calls it instead.
  if (state.phase === 'review' && state.sprintGoal.trim() && state.sprintGoalMet === null && state.sprintGoalFacts) {
    const met = state.sprintGoalFacts.reading;
    return { action: { type: 'CALL_SPRINT_GOAL', met },
             says: met ? 'What the Sprint Goal was for got Done.' : 'What the Sprint Goal was for is not Done yet.' };
  }
  return null;
}

/** Is there anything an AI in this seat should be doing? Used to decide whether to show that
 *  a seat is thinking, without taking the move. */
export const aiHasTurn = (state: ZooGameState, seat: SeatName): boolean => aiTurn(state, seat) !== null;

/** Why an item cannot be planned yet, for a seat that wants to say so rather than silently
 *  skip it. Re-exported so the AI seats and the screens give the same reason. */
export { notReady };
