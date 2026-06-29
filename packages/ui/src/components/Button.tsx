import * as React from 'react';
import { colors, radii, fonts } from '../tokens';

export type ButtonVariant = 'primary' | 'deep' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `primary` is the orange brand button. */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: 'none',
  borderRadius: radii.md,
  fontWeight: 700,
  fontFamily: fonts.sans,
  cursor: 'pointer',
  textDecoration: 'none',
  lineHeight: 1,
  transition: 'background 0.2s ease, transform 0.2s ease',
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '10px 18px', fontSize: 14 },
  md: { padding: '13px 26px', fontSize: 15 },
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: colors.orange, color: colors.deepTeal },
  deep: { background: colors.deepTeal, color: colors.white },
  ghost: { background: 'transparent', color: colors.deepTeal, padding: 0 },
  outline: { background: 'transparent', color: colors.deepTeal, border: `1px solid ${colors.paleTeal}` },
};

/** The brand button. Self-contained styling (no Tailwind dependency) so it renders
 *  identically in the Site, the App and Claude Design. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', style, ...props }, ref) => (
    <button ref={ref} style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props} />
  ),
);
Button.displayName = 'Button';
