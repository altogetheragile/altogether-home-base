import type { ToolbarIcon as Drawing } from './toolbarIcons';

// An icon on the build strip.
//
// Same idea as BoardIcon and drawn by the same hand: generated from files in docs/, markup lifted
// whole, nothing here picks a colour. The difference is what the colour comes from. A board icon is
// an illustration and carries the brand palette; a strip icon is a control, so its ink is
// `currentColor` and the button it sits on decides - grey when idle, darker under the pointer,
// orange when the menu is open.
//
// Always decoration. Every one of these sits on a button whose accessible name is the word the icon
// stands for, and a picture announced beside the word it means is the word said twice.

export function ToolIcon({ icon, className }: { icon: Drawing; className?: string }) {
  return (
    <svg viewBox={icon.box} className={className} aria-hidden
      dangerouslySetInnerHTML={{ __html: icon.inner }} />
  );
}
