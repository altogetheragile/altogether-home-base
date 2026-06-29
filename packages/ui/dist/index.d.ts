export { ColorToken, colors, fontWeights, fonts, radii, space, tokens } from './tokens.js';
import * as React from 'react';

type ButtonVariant = 'primary' | 'deep' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style. `primary` is the orange brand button. */
    variant?: ButtonVariant;
    size?: ButtonSize;
}
/** The brand button. Self-contained styling (no Tailwind dependency) so it renders
 *  identically in the Site, the App and Claude Design. */
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

type BadgeTone = 'teal' | 'orange' | 'neutral';
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: BadgeTone;
}
/** A small status/label pill. */
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>>;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Adds a subtle brand shadow. */
    raised?: boolean;
}
/** A surface container with the brand radius and border. */
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;

export { Badge, type BadgeProps, type BadgeTone, Button, type ButtonProps, type ButtonSize, type ButtonVariant, Card, type CardProps };
