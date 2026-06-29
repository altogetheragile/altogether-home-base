import { fonts, radii, colors } from './chunk-63HQX2YB.js';
export { colors, fontWeights, fonts, radii, space, tokens } from './chunk-63HQX2YB.js';
import * as React from 'react';
import { jsx } from 'react/jsx-runtime';

var base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "none",
  borderRadius: radii.md,
  fontWeight: 700,
  fontFamily: fonts.sans,
  cursor: "pointer",
  textDecoration: "none",
  lineHeight: 1,
  transition: "background 0.2s ease, transform 0.2s ease"
};
var sizes = {
  sm: { padding: "10px 18px", fontSize: 14 },
  md: { padding: "13px 26px", fontSize: 15 }
};
var variants = {
  primary: { background: colors.orange, color: colors.deepTeal },
  deep: { background: colors.deepTeal, color: colors.white },
  ghost: { background: "transparent", color: colors.deepTeal, padding: 0 },
  outline: { background: "transparent", color: colors.deepTeal, border: `1px solid ${colors.paleTeal}` }
};
var Button = React.forwardRef(
  ({ variant = "primary", size = "md", style, ...props }, ref) => /* @__PURE__ */ jsx("button", { ref, style: { ...base, ...sizes[size], ...variants[variant], ...style }, ...props })
);
Button.displayName = "Button";
var tones = {
  teal: { background: colors.paleTeal, color: colors.midTeal },
  orange: { background: colors.orange, color: colors.white },
  neutral: { background: colors.skyTeal, color: colors.deepTeal }
};
var Badge = React.forwardRef(
  ({ tone = "teal", style, ...props }, ref) => /* @__PURE__ */ jsx(
    "span",
    {
      ref,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: radii.pill,
        ...tones[tone],
        ...style
      },
      ...props
    }
  )
);
Badge.displayName = "Badge";
var Card = React.forwardRef(
  ({ raised = false, style, ...props }, ref) => /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      style: {
        background: colors.white,
        border: `1px solid ${colors.paleTeal}`,
        borderRadius: radii.xl,
        boxShadow: raised ? "0 2px 12px rgba(0,77,77,0.07)" : void 0,
        ...style
      },
      ...props
    }
  )
);
Card.displayName = "Card";

export { Badge, Button, Card };
