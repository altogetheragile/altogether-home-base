// Guard destructive editor actions (Clear, Load Example, Import JSON) that
// replace the current content. A single mis-click on one of these used to wipe a
// saved artifact, so anything that throws away content must confirm first.
// Returns true when it is safe to proceed (no content to lose, or user agreed).
export const confirmReplace = (
  hasContent: boolean,
  message = 'This replaces the current content and cannot be undone. Continue?',
): boolean => !hasContent || window.confirm(message);
