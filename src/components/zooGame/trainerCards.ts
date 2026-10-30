// ============= The trainer's deck =============
//
// What a trainer can play into a Sprint. Shipped with three cards, and an admin can reword them,
// take them out of the deck and add their own - saved as one row in `zoo_copy`, the same table the
// teaching copy and the game's numbers live in, and laid over the shipped deck when the game loads.
//
// A card is only ever a SITUATION. What the team does about it is the game's, and so is what each
// kind costs: a block stops one item, an impediment slows the whole team, and a decision goes to
// the Product Owner with the same three answers every time. An admin chooses which of
// the two a card is, and writes the story; they cannot write a new mechanic, because there is none
// to write. That is what keeps an extended deck teaching the same lesson as the shipped one.

export type TrainerCardKind = 'block' | 'impediment' | 'decision';

/** What the Product Owner can do about a decision card. The same three for every one, because these
 *  are the three things Scrum gives that accountability: absorb it without endangering the Sprint
 *  Goal, order it into the Product Backlog, or - theirs alone - cancel the Sprint. */
export type CardChoice = 'now' | 'backlog' | 'cancel';

export interface TrainerCard {
  id: string;
  kind: TrainerCardKind;
  title: string;
  /** What has happened. For a block, "this one" is replaced with the name of the item it lands on. */
  detail: string;
  /** Who has to decide what to do about it. Said on the card so the trainer plays it knowingly. */
  landsOn: string;
  /** What it is there to teach, for the trainer's eyes. */
  lesson: string;
  /** For a decision card: the Product Backlog item it turns into if the Product Owner orders it in. */
  item?: string;
  /** For a decision card: what a Product Owner played by the game chooses, and why it says it did. */
  aiChoice?: CardChoice;
  aiSays?: string;
  /** Kept in the deck but not offered. A shipped card is taken out this way rather than deleted, so
   *  putting it back is one tick. */
  off?: boolean;
  /** One the game shipped with, rather than one an admin added. */
  shipped?: boolean;
}

/** What a played card carries into the game: the situation as it read when it was played. Carried
 *  whole, so a deck reworded tomorrow cannot rewrite a Sprint that was played today - and every
 *  browser in the session lands the same card whatever deck it loaded. */
export type PlayedCard = Pick<TrainerCard, 'id' | 'kind' | 'title' | 'detail' | 'item' | 'aiChoice' | 'aiSays'> & Partial<Pick<TrainerCard, 'landsOn'>>;

export const SHIPPED_TRAINER_CARDS: readonly TrainerCard[] = [
  { id: 'materials', kind: 'block', shipped: true, title: 'The materials are delayed',
    detail: 'The timber for this one has not arrived, and the work on it has stopped.',
    landsOn: 'Developers', lesson: 'A block on one item. Can the Developers clear it themselves, and does it threaten the Sprint Goal?' },
  { id: 'sick', kind: 'impediment', shipped: true, title: 'A Developer is off sick',
    detail: 'One pair of hands fewer today, so the build is slower than planned.',
    landsOn: 'Developers and Scrum Master', lesson: 'Capacity drops. The Developers re-plan at the Daily Scrum, and the Scrum Master asks what help they need.' },
  { id: 'inspection', kind: 'block', shipped: true, title: 'The safety inspector is coming',
    detail: 'This one cannot open until the inspector has signed it off.',
    landsOn: 'Developers', lesson: 'Quality is not optional. Does the work meet the Definition of Done, or was it nearly Done?' },
  { id: 'escape', kind: 'decision', shipped: true, title: 'A lion has escaped',
    detail: 'The lion is loose by the car park. The keepers need help now, and the fence that let it out needs mending properly.',
    landsOn: 'Product Owner', item: 'Mend the lion fence properly', aiChoice: 'now',
    aiSays: 'Safety comes first, so we deal with it today. The Sprint Goal still stands.',
    lesson: 'Urgent unplanned work. Absorb it, order it into the Product Backlog, or cancel the Sprint? Only the Product Owner can cancel.' },
  { id: 'stakeholder', kind: 'decision', shipped: true, title: 'A stakeholder changes their mind',
    detail: 'The zoo\u2019s sponsor now wants a gift shop by the entrance, and asks for it this Sprint.',
    landsOn: 'Product Owner', item: 'Gift Shop', aiChoice: 'backlog',
    aiSays: 'A good idea, and it goes on the Product Backlog where we can order it. This Sprint\u2019s Goal stands.',
    lesson: 'Scope is negotiated with the Product Owner, without endangering the Sprint Goal. Who did the sponsor ask, and where did it go?' },
];

/** The three answers to a decision card, as the Product Owner is offered them. */
export const CARD_CHOICES: { key: CardChoice; label: string; note: (item?: string) => string }[] = [
  { key: 'now', label: 'Deal with it now', note: () => 'It costs a quarter of today\u2019s build time.' },
  { key: 'backlog', label: 'Add to the Product Backlog',
    note: (item) => `${item ? `\u201c${item}\u201d goes` : 'It goes'} at the top, for the next Sprint. Nothing changes in this one.` },
  { key: 'cancel', label: 'Cancel the Sprint', note: () => 'Only if it makes the Sprint Goal obsolete. Unfinished work goes back to the Product Backlog.' },
];

/** The `zoo_copy` key the whole deck is saved under. */
export const DECK_KEY = 'deck.trainer';

/** Who a card can land on. A short list rather than free text, so the deck reads the same way. */
export const LANDS_ON = ['Developers', 'Scrum Master', 'Developers and Scrum Master', 'Product Owner'] as const;

const clean = (s: unknown, max: number): string => (typeof s === 'string' ? s.trim().slice(0, max) : '');

/** A saved deck, or null if what is saved is not one. Anything malformed is dropped card by card
 *  rather than taking the whole deck with it: one bad row should not leave a trainer empty-handed. */
export function parseDeck(raw: string | undefined): TrainerCard[] | null {
  if (!raw) return null;
  let rows: unknown;
  try { rows = JSON.parse(raw); } catch { return null; }
  if (!Array.isArray(rows)) return null;
  const seen = new Set<string>();
  const cards: TrainerCard[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    const id = clean(r?.id, 60);
    const title = clean(r?.title, 80);
    const kind = r?.kind === 'impediment' || r?.kind === 'block' || r?.kind === 'decision' ? r.kind as TrainerCardKind : null;
    if (!id || !title || !kind || seen.has(id)) continue;
    seen.add(id);
    cards.push({ id, kind, title, detail: clean(r.detail, 240), landsOn: clean(r.landsOn, 60) || 'Developers',
      lesson: clean(r.lesson, 240), off: r.off === true || undefined,
      ...(kind === 'decision' ? {
        landsOn: 'Product Owner',
        item: clean(r.item, 60) || undefined,
        aiChoice: r.aiChoice === 'backlog' || r.aiChoice === 'cancel' ? r.aiChoice : 'now' as CardChoice,
        aiSays: clean(r.aiSays, 200) || undefined,
      } : {}),
      shipped: SHIPPED_TRAINER_CARDS.some((c) => c.id === id) || undefined });
  }
  return cards;
}

let deck: TrainerCard[] = [...SHIPPED_TRAINER_CARDS];

/** Lay the saved deck over the shipped one. Called once the copy has loaded. */
export function applyDeck(overrides: Record<string, string>): void {
  deck = parseDeck(overrides[DECK_KEY]) ?? [...SHIPPED_TRAINER_CARDS];
}

/** The whole deck, cards taken out included - which is what the editor needs. */
export const trainerDeck = (): TrainerCard[] => deck;

/** The cards a trainer is offered. */
export const playableCards = (): TrainerCard[] => deck.filter((c) => !c.off);

/** A card as it goes into the game. */
export const asPlayed = (c: TrainerCard): PlayedCard => ({ id: c.id, kind: c.kind, title: c.title, detail: c.detail, landsOn: c.landsOn,
  ...(c.kind === 'decision' ? { item: c.item, aiChoice: c.aiChoice, aiSays: c.aiSays } : {}) });
