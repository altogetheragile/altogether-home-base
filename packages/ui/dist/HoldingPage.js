import { jsxs, jsx } from 'react/jsx-runtime';

// src/tokens.ts
var colors = {
  skyTeal: "#F0FAFA",
  deepTeal: "#004D4D",
  orange: "#FF9715",
  body: "#374151"};
var fonts = {
  serif: "var(--aa-font-heading, 'DM Serif Display', Georgia, serif)",
  sans: "var(--aa-font-body, 'DM Sans', system-ui, sans-serif)"};
function HoldingPage({
  logo,
  heading,
  body,
  email
}) {
  const address = email?.trim();
  return /* @__PURE__ */ jsxs(
    "main",
    {
      style: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 24,
        padding: "48px 24px",
        background: `var(--aa-sky-teal, ${colors.skyTeal})`,
        fontFamily: fonts.sans
      },
      children: [
        logo.mode === "image" ? /* @__PURE__ */ jsx("img", { src: logo.src, alt: heading, style: { height: 44, width: "auto" } }) : /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 24,
              color: `var(--aa-deep-teal, ${colors.deepTeal})`,
              letterSpacing: "-0.02em"
            },
            children: logo.text
          }
        ),
        /* @__PURE__ */ jsx(
          "h1",
          {
            style: {
              fontFamily: fonts.serif,
              color: `var(--aa-deep-teal, ${colors.deepTeal})`,
              fontWeight: 400,
              fontSize: "clamp(30px, 6vw, 46px)",
              lineHeight: 1.15,
              margin: 0,
              maxWidth: 680
            },
            children: heading.trim() || "Something is on its way"
          }
        ),
        body.trim() && /* @__PURE__ */ jsx("p", { style: { color: `var(--aa-body, ${colors.body})`, fontSize: 17, lineHeight: 1.7, margin: 0, maxWidth: 520 }, children: body }),
        address && /* @__PURE__ */ jsx(
          "a",
          {
            href: `mailto:${address}`,
            style: {
              color: `var(--aa-deep-teal, ${colors.deepTeal})`,
              background: `var(--aa-orange, ${colors.orange})`,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
              padding: "13px 26px",
              borderRadius: 10
            },
            children: address
          }
        )
      ]
    }
  );
}

export { HoldingPage };
