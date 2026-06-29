import * as React from 'react';
import { colors, radii } from '../tokens';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle brand shadow. */
  raised?: boolean;
}

/** A surface container with the brand radius and border. */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ raised = false, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        background: colors.white,
        border: `1px solid ${colors.paleTeal}`,
        borderRadius: radii.xl,
        boxShadow: raised ? '0 2px 12px rgba(0,77,77,0.07)' : undefined,
        ...style,
      }}
      {...props}
    />
  ),
);
Card.displayName = 'Card';
