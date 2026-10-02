import { BOARD_ICONS, type BoardIconName } from './boardIcons';

// An icon off the board, in the game.
//
// One visual language across the three: `docs/scrum-board/COURSE-AND-BOARD.md` maps the board to
// the game piece by piece - the Product Backlog icon to the Product Backlog tab, the Increment cube
// to the Increment tab, the Definition of Done gem shown apart from each item's acceptance
// criteria. A learner should meet the same picture on the diagram, in the game and on a lesson
// card.
//
// Until now the game drew those concepts in whatever lucide had: a trophy for the Product Goal, a
// clipboard for the Product Backlog, a parcel for the Increment. Good icons, and nothing to do with
// the board a learner had been looking at ten minutes earlier.
//
// Generated from the design file, so it is the same artwork, down to the gem on the cube's corner.

export function BoardIcon({ name, className, title }: {
  name: BoardIconName;
  /** Sized like a lucide icon, so it drops into the places that used one. */
  className?: string;
  /** Given a title it is a picture worth announcing; without one it is decoration beside a word
   *  that already says what it is, which is most of where these sit. */
  title?: string;
}) {
  const icon = BOARD_ICONS[name];
  if (!icon) return null;
  return (
    <svg viewBox={icon.box} className={className} aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined} aria-label={title}
      dangerouslySetInnerHTML={{ __html: icon.inner }} />
  );
}

/** The ones the game has a word for, named as the game names them. */
export const BOARD = {
  productBacklog: 'product_backlog',
  sprintBacklog: 'sprint_backlog',
  increment: 'increment',
  productGoal: 'product_goal',
  sprintGoal: 'sprint_goal',
  definitionOfDone: 'definition_of_done',
  productOwner: 'product_owner',
  scrumMaster: 'scrum_master',
  developers: 'developers',
  scrumTeam: 'scrum_team',
  stakeholder: 'stakeholder',
} as const satisfies Record<string, BoardIconName>;
