import type { ZooAction } from './types';
import type { SeatName } from './useZooSessions';

// Who may do what, and why.
//
// This is the point of playing together. Alone you are the Product Owner and the Developers
// and the Scrum Master at once, so nothing you do is different because of who you are and
// nothing ever pushes back - which is exactly why the accountabilities read as labels. Here
// one person orders the Backlog and the others have to go and talk to them.
//
// Two rules kept this honest while writing it:
//
// 1. Only assign what the Guide actually assigns. Most of the game is the Scrum Team's work
//    and stays open to the whole team; a gate invented for tidiness would teach a rule that
//    does not exist. The list below is short on purpose.
// 2. Refuse with a reason, not a disabled control. A learner who is told "ordering the
//    Product Backlog is the Product Owner's call" has learned something. A greyed-out button
//    teaches nothing and reads as a bug.

export type Accountability = SeatName | 'anyone';

/** Whose call it is, with the sentence to say when somebody else tries. Anything absent is
 *  the whole Scrum Team's, which is most of the game. */
const OWNER: Partial<Record<ZooAction['type'], { who: Accountability; because: string }>> = {
  // ---- The Product Owner ----
  // "The Product Owner is accountable for maximising the value of the product... Product
  // Backlog management includes developing the Product Goal, creating and ordering items,
  // and making the Product Backlog transparent."
  SET_PRODUCT_GOAL:  { who: 'product_owner', because: 'The Product Goal is the Product Owner’s to develop and communicate.' },
  SET_GOAL_FORM:     { who: 'product_owner', because: 'The Product Goal is the Product Owner’s to develop and communicate.' },
  WRITE_BACKLOG:     { who: 'product_owner', because: 'The Product Backlog is the Product Owner’s to create and order.' },
  ADD_PBI:           { who: 'product_owner', because: 'Anyone may suggest an item, but whether it goes on the Backlog is the Product Owner’s call.' },
  DELETE_PBI:        { who: 'product_owner', because: 'What is on the Product Backlog is the Product Owner’s call.' },
  DUPLICATE_PBI:     { who: 'product_owner', because: 'What is on the Product Backlog is the Product Owner’s call.' },
  REORDER_IN_ZONE:   { who: 'product_owner', because: 'Ordering the Product Backlog is the Product Owner’s call.' },
  MOVE_ITEM_BEFORE:  { who: 'product_owner', because: 'Ordering the Product Backlog is the Product Owner’s call.' },
  MOVE_ZONE:         { who: 'product_owner', because: 'Ordering the Product Backlog is the Product Owner’s call.' },
  ACCEPT_SIGNAL:     { who: 'product_owner', because: 'What the visitors asked for becomes a Backlog item when the Product Owner decides it does.' },
  DECLINE_PROPOSAL:  { who: 'product_owner', because: 'Turning something down is a Backlog decision, and the Backlog is the Product Owner’s.' },
  PO_REFINE:         { who: 'product_owner', because: 'This is the Product Owner doing their own work on the Product Backlog.' },
  OPEN_ITEM:         { who: 'product_owner', because: 'When something Done is released to visitors is the Product Owner’s call.' },
  // "A Sprint could be cancelled if the Sprint Goal becomes obsolete. Only the Product Owner
  // has the authority to cancel the Sprint." The one place the Guide says "only".
  CANCEL_SPRINT:     { who: 'product_owner', because: 'Only the Product Owner has the authority to cancel a Sprint.' },

  // ---- The Developers ----
  // "The Developers are always accountable for creating a plan for the Sprint, the Sprint
  // Backlog." Sizing is theirs, and so is how the work gets done.
  ESTIMATE_ITEM:     { who: 'developer', because: 'The people who will do the work are the people who size it.' },
  PLAN_SPRINT:       { who: 'developer', because: 'The Developers select what they forecast they can finish.' },
  MOVE_SPRINT_ITEM:  { who: 'developer', because: 'The Sprint Backlog is a plan by and for the Developers.' },
  MOVE_FORECAST_ITEM:{ who: 'developer', because: 'The Sprint Backlog is a plan by and for the Developers.' },
  SET_TASKS:         { who: 'developer', because: 'How the work gets done is the Developers’ to plan.' },
  TOGGLE_TASK:       { who: 'developer', because: 'How the work gets done is the Developers’ to plan.' },
  PULL_ITEM:         { who: 'developer', because: 'The Developers pull their own work. Nobody assigns it to them.' },
  ASSIGN_DEV:        { who: 'developer', because: 'A self-managing team decides who does what. Nobody assigns work to a Developer.' },
  SET_WIP_LIMIT:     { who: 'developer', because: 'How much the Developers take on at once is theirs to manage.' },
};

export interface Verdict {
  allowed: boolean;
  /** Whose call it is, when it is not yours. */
  owner?: Accountability;
  /** What to say. Written to teach, so it is worth showing rather than swallowing. */
  because?: string;
}

const ALLOWED: Verdict = { allowed: true };

export interface SeatContext {
  /** The accountability this player holds, or null for an observer or a player with no seat. */
  seat: SeatName | null;
  /** True for a participant watching rather than playing. */
  observer?: boolean;
  /** Seats nobody has taken and no AI is playing. Their work falls to the whole team rather
   *  than to nobody, or a group of two could not finish a Sprint. */
  emptySeats?: SeatName[];
}

/** May this player take this action? */
export function mayTake(type: ZooAction['type'], ctx: SeatContext): Verdict {
  // Watching means acting on nothing. That is the whole of what an observer is, and it is
  // how a trainer sits with a team without becoming a sixth Developer.
  if (ctx.observer) {
    return { allowed: false, because: 'You are watching this team, so you take no part in the work.' };
  }
  const rule = OWNER[type];
  if (!rule || rule.who === 'anyone') return ALLOWED;         // most of the game: the team's
  if (ctx.seat === rule.who) return ALLOWED;
  // Nobody is holding that accountability, so the team carries it between them. Better than
  // a deadlock, and it is what a real team short of a Product Owner ends up doing.
  if (ctx.emptySeats?.includes(rule.who)) return ALLOWED;
  return { allowed: false, owner: rule.who, because: rule.because };
}

const LABEL: Record<Accountability, string> = {
  product_owner: 'the Product Owner', scrum_master: 'the Scrum Master',
  developer: 'the Developers', anyone: 'the Scrum Team',
};

/** One line to put in front of somebody, naming whose call it is. */
export function refusal(v: Verdict): string {
  if (v.allowed) return '';
  return v.owner ? `${v.because} Ask ${LABEL[v.owner]}.` : v.because ?? '';
}

/** Everything this seat may not do, for a screen that wants to show it up front rather than
 *  waiting for somebody to try. */
export function ownedBy(who: Accountability): ZooAction['type'][] {
  return (Object.keys(OWNER) as ZooAction['type'][]).filter((t) => OWNER[t]?.who === who);
}
