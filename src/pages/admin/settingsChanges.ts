export type Flags = Record<string, boolean>;

/** The flags somebody actually moved.
 *
 *  In its own module, not beside the component, because a non-component export from a .tsx file
 *  trips react-refresh and the lint gate sits at its limit.
 *
 *  The save used to send every flag on the form. A column that is null means nobody has decided,
 *  and the page renders it with the code's default. Sending the whole form turned each of those
 *  into an explicit value, so switching AI Tools off also wrote show_knowledge=false and
 *  show_exams=false, because those are off by default for a new site and had never been set here.
 *  The Resources menu emptied itself and nothing said why. */
export function onlyWhatChanged(now: Flags, before: Flags): Flags {
  return Object.fromEntries(Object.entries(now).filter(([flag, value]) => value !== before[flag]));
}
