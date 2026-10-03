import {
  PERSON_BOX, PERSON_HEAD, PERSON_BODY, PERSON_LABEL, PERSON_SHIFT,
} from './personShape';

// One person, drawn the way the board draws people.
//
// The shape itself is next door in `personShape.ts`, because it is data rather than a component and
// the board's own icons are checked against it. This is the drawing of it.

export function Person({ hex, initials, className, style, title }: {
  /** The colour this person is. An accountability's own, or a Developer's shade of the stack. */
  hex: string;
  /** What is written on them, if anything. The board writes two letters on its three people
   *  because the icon is all there is - nothing on the diagram says "Product Owner" beside it.
   *
   *  A Developer in the game is listed by name, so a letter on their chest is the first letter of
   *  the word already next to it: "A, B, C on dev's is not needed." Left out, the figure is drawn
   *  without it. */
  initials?: string;
  className?: string;
  /** For a caller that sizes in numbers rather than classes - see `personSize`. */
  style?: React.CSSProperties;
  /** Given a title it is a picture worth announcing. Most of these sit beside the person's name,
   *  which already says who it is, so most of them are decoration. */
  title?: string;
}) {
  return (
    <svg viewBox={PERSON_BOX} className={className} style={style}
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} aria-label={title}>
      <g transform={PERSON_SHIFT}>
        <circle cx={PERSON_HEAD.cx} cy={PERSON_HEAD.cy} r={PERSON_HEAD.r} fill={hex} />
        <path d={PERSON_BODY} fill={hex} />
        {initials && (
          <text x={PERSON_LABEL.x} y={PERSON_LABEL.y} textAnchor="middle"
            fontSize={PERSON_LABEL.fontSize} fontWeight={PERSON_LABEL.fontWeight} fill="#fff">
            {initials}
          </text>
        )}
      </g>
    </svg>
  );
}
