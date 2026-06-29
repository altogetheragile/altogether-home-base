import * as React from 'react';
import { colors, radii } from '../tokens';

export type BadgeTone = 'teal' | 'orange' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, React.CSSProperties> = {
  teal: { background: colors.paleTeal, color: colors.midTeal },
  orange: { background: colors.orange, color: colors.white },
  neutral: { background: colors.skyTeal, color: colors.deepTeal },
};

/** A small status/label pill. */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone = 'teal', style, ...props }, ref) => (
    <span
      ref={ref}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: radii.pill,
        ...tones[tone],
        ...style,
      }}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
