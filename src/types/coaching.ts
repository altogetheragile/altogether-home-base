// Shared coaching metadata for cells across the Vision to Value tools.
// Generalised from the Impact Map's LEVEL_META (see docs/VISION_TO_VALUE.md 5.1).
// The "stretch" is a gentle, open coaching question, aimed at the work never the
// person, offered after the user has content. Never labelled "challenge" or
// "aporetic" in the UI.

export interface CellCoach {
  /** Short label, e.g. 'WHY'. */
  tag: string;
  /** The open question that opens the cell. */
  question: string;
  /** One or two sentences of guidance. */
  help: string;
  /** The gentle stretch question, in coaching voice. */
  stretch: string;
  /** Brand colour for the cell. */
  color: string;
}

/** Conversation turn shape shared with the coach-reflect edge function. */
export interface CoachTurn {
  role: 'user' | 'coach';
  text: string;
}

export type CoachMode = 'coach' | 'guide';
