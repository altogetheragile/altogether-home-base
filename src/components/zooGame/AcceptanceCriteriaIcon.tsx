import { TOOLBAR_ICONS } from './toolbarIcons';

// The mark for acceptance criteria.
//
// A clipboard with its lines ticked off and a check beside it. It stands wherever the words
// "Acceptance criteria" do - the button on the build strip, and both shapes of the panel that
// button opens - so one picture carries one idea across the three places it appears.
//
// Drawn by the same hand and to the same rules as the strip's icons, so it comes through the same
// folder and the same generator: one colour, a 24-square box, `currentColor` for ink. It is the one
// drawing in that folder that is not a build group's - it belongs to the item rather than to a
// control - which `theStripIsPictures` knows about by name rather than by having its orphan check
// loosened to let anything unused through.
//
// It draws itself rather than going through `ToolIcon`, whose promise is that it is always
// decoration on a button that is named in words. This one can be the only thing announcing what a
// panel is about, so it may carry a title.

const DRAWING = TOOLBAR_ICONS['acceptance-criteria'];

export function AcceptanceCriteriaIcon({ className, title }: {
  className?: string;
  /** Given a title it is announced; beside the words it means, it is decoration. */
  title?: string;
}) {
  return (
    <svg viewBox={DRAWING.box} data-part="ac-mark" className={className}
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} aria-label={title}
      dangerouslySetInnerHTML={{ __html: DRAWING.inner }} />
  );
}
