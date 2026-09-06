# Lesson Cards: Implementation Spec

Al's spec, 6 September 2026, kept with the code it describes. Nothing is built from it yet. Builds the sketchnote-style lesson cards agreed on 4 September, with the branding footer from 5 September. The reference render (`lesson-card-forecast-not-commitment.png`, produced by `lesson-card-reference.py` in Python and Pillow) lives with the design frames outside the repository; it comes in as a test fixture when the component is built. The product implementation is a React component.

## What A Lesson Card Is

A single-idea teaching card shown at a moment in the game. One title, one line, four panels, one line to remember. Hand-drawn look, two colours plus ink. It reads in under twenty seconds. Cards appear in the Learn drawer (Notes section) and at pause points in course and self-study modes.

Cards are data. A card is a JSON object. The component renders any card from its data. No card is hand-coded.

## Data Model

```ts
type LessonCard = {
  id: string;                 // slug, e.g. "forecast-not-commitment"
  number: number;             // printed bottom right, "lesson card 07"
  moment: string;             // moment id that triggers it, e.g. "sprint.day.forecastSlipping"
  title: string;              // ≤ 4 words. Title box.
  subtitle: string;           // one line, underlined
  panels: [Panel, Panel, Panel, Panel];   // exactly four
  remember: string;           // the line to remember, boxed in orange
  remember_sub?: string[];    // up to two supporting lines under it
  source?: string;            // optional Scrum Guide reference, small
};

type Panel = {
  heading: string;            // ≤ 5 words, underlined in orange
  blocks: Block[];            // 1 to 4
};

type Block =
  | { kind: "text"; text: string; tone?: "ink" | "teal" | "orange"; hand?: boolean }
  | { kind: "box"; text: string; caption?: string; captionTone?: "teal" | "orange" }
  | { kind: "pair"; left: Block & {kind:"box"}; right: Block & {kind:"box"} }
  | { kind: "list"; items: string[]; mark: "cross" | "tick" | "none" }
  | { kind: "callout"; lines: string[]; emphasis: string }   // tinted panel, used for "In the zoo"
```

Panel four is always the "In the zoo" panel: it names the screen the learner is on and the decision in front of them. Enforce in a validator: `panels[3].heading === "In the zoo"`.

## Layout

Fixed canvas 1000 × 1250 units, rendered as SVG with `viewBox="0 0 1000 1250"` so it scales. Portrait. Background `#FCFBF8`.

| Region | Box (x, y, w, h) | Notes |
|---|---|---|
| Title box | 150, 50, 700, 90 | 4px hand-drawn border, title 44px centred |
| Subtitle | centred at y 170 | 26px, orange underline 3px from x 230 to 770 at y 190 |
| Dividers | vertical x 500 from y 225 to 930; horizontal y 575 from x 60 to 940 | 3px hand-drawn |
| Panel 1 | 90, 240, 400, 320 | numbered circle at (90, 270) |
| Panel 2 | 540, 240, 400, 320 | numbered circle at (540, 270) |
| Panel 3 | 90, 590, 400, 320 | numbered circle at (90, 620) |
| Panel 4 | 540, 590, 400, 320 | numbered circle at (540, 620); tinted `#E8F0E8` |
| Remember box | 90, 960, 820, 210 | 4px orange hand-drawn border; headline 42px centred at y 1010; sub lines 26px at y 1070 and 1110 |
| Footer | y 1178 to 1230 | mark 52px at x 90; wordmark at x 154; card number right-aligned at x 910, y 1215 |

Panel heading: 30px at panel top, orange underline 3px the width of the heading text, 20px below baseline. Numbered circle: 40px diameter, 3px orange stroke, number 26px orange.

## Type

Two open-licence fonts, self-hosted under `/public/fonts`:

- **Patrick Hand** (OFL) for body, headings, boxes, lists. Sizes 20 to 44.
- **Caveat** (OFL) for handwritten asides: captions under boxes, the emphasis line in the callout, any block with `hand: true`. Sizes 22 to 30.

Do not use the app's DM Sans on the card. The card is a different surface from the UI and should look drawn, not set.

## Colour

Three colours only.

| Token | Hex | Use |
|---|---|---|
| ink | `#28282C` | all lines and body text |
| teal | `#004D4D` | the Scrum term; "this is the rule" |
| orange | `#E67800` | the thing to notice; underlines, remember box, crosses, circled numbers |

Orange on the card is `#E67800`, darker than the brand's `#FF9715`, because it has to carry text on a cream ground. Never introduce a fourth colour. Panel four's tint `#E8F0E8` is a ground, not a colour.

## The Hand-Drawn Look

Every line and box is drawn as a polyline with small random jitter, not a straight SVG rect. Implement one helper:

```ts
// returns an SVG path string from p1 to p2 with jitter
wobble(p1, p2, amplitude = 1.6, segment = 12, seed): string
```

Boxes are four wobbled lines. Use a seeded PRNG keyed by `card.id` so a card renders the same every time (deterministic, like the game). Stroke width 3, `stroke-linejoin="round"`, `stroke-linecap="round"`. No filters, no SVG `feTurbulence`; it does not print well and is slower.

Crosses in a list are two wobbled orange lines, 4px, 20 × 24 at the right edge of the item box. Ticks are a single wobbled teal polyline.

## Footer

Below the remember box, outside the drawn area, so the branding reads as a printed footer:

- 皆 mark: the favicon SVG at 52 × 52, x 90, y 1178. Reference the app's existing favicon component; do not re-draw it. If the favicon still relies on a system CJK font, convert the glyph to a path first (see note below).
- Wordmark: "ALTOGETHER" in teal and "AGILE" in orange, DM Sans Bold 18px, x 154, baseline aligned with the mark's centre. This is the one place DM Sans appears on the card, because the wordmark is the brand's, not the card's.
- Right: "Build A Zoo · lesson card 07" 18px Patrick Hand, `#787878`, right-aligned at x 910.

## Component

```tsx
<LessonCard card={card} width={500} />        // renders SVG scaled to width
<LessonCard card={card} print />              // full-size, print stylesheet
```

- Pure function of `card`. No game state inside; the caller passes numbers (e.g. "10 pts left") already substituted into the card text.
- Export to PNG at 1000 × 1250 and 2000 × 2500 via `canvas` from the SVG, for the self-study download and for printing. Export to PDF via the existing print route.
- Accessible: `role="img"`, `aria-label` = `${title}. ${remember}`. Every text element is real SVG text, not paths, so it can be read and searched.

## Where Cards Appear

- **Learn drawer, Notes section.** The cards for this Sprint's moments, newest first, at 380px wide. Click opens full size in a modal.
- **Pause points** (course and self-study modes). The card is shown full-size over a dimmed screen, with Continue. If a question is attached to the moment, the card comes first and the question second.
- **Guided solo mode.** Cards are available in Learn but never shown unprompted.

Trigger: when a `moment` fires and `mode.teaching === true`, push the card with that `moment` id to the Notes stack. Never show the same card twice in a session.

## Content Rules

Cards are written in British English, short sentences, no jargon. Title Case is not used on cards; they are handwritten and sentence case reads as handwritten. Never use an em dash. "Framework", never "methodology". Panel four always names a real screen state and a real decision. The remember line is a sentence a learner could say back a week later.

The first card is a fixture in `/fixtures/lesson-cards/forecast-not-commitment.json` and must render identically to the reference PNG (allowing for font hinting). Use it as the visual regression baseline.

## Acceptance

- Any card renders from data with no per-card code.
- The reference card matches the PNG to the eye at 1000 × 1250.
- Same card, same render: deterministic wobble.
- Three colours plus ink; a lint rule fails any other hex on the card surface.
- Prints on A4 portrait with the footer visible and nothing clipped.
- Renders under 16ms at 500px wide in the drawer (measure with the profiler; no filters is what makes this achievable).

## Note On The Favicon

The favicon SVG draws 皆 with a `font-family` list of system CJK fonts. Linux machines without a CJK font show a box. Convert the glyph to a path once (Noto Sans JP, weight 400, as rendered in the reference) and use the path in both the favicon and the card footer.

## Reference Fixture

```json
{
  "id": "forecast-not-commitment",
  "number": 7,
  "moment": "sprint.day.forecastSlipping",
  "title": "Forecast, not commitment",
  "subtitle": "What the Sprint Backlog promises, and what it does not",
  "panels": [
    { "heading": "Two things leave Sprint Planning", "blocks": [
      { "kind": "pair",
        "left":  { "kind": "box", "text": "Sprint Goal", "caption": "the commitment", "captionTone": "teal" },
        "right": { "kind": "box", "text": "4 items, 18 pts", "caption": "the forecast", "captionTone": "orange" } },
      { "kind": "text", "text": "One is a promise. One is a best guess." },
      { "kind": "text", "text": "Mixing them up is the commonest exam trap." }
    ]},
    { "heading": "When the forecast slips", "blocks": [
      { "kind": "box", "text": "day 2: only 14 of 18 will be Done", "caption": "the Sprint is NOT a failure", "captionTone": "teal" },
      { "kind": "text", "text": "Developers and PO renegotiate scope." },
      { "kind": "text", "text": "The goal stays. The Sprint length stays." },
      { "kind": "text", "text": "Drop the planting, keep the giraffe.", "tone": "orange", "hand": true }
    ]},
    { "heading": "What you cannot do", "blocks": [
      { "kind": "list", "mark": "cross", "items": [
        "extend the Sprint to fit the work",
        "swap the goal for the items",
        "call it a commitment at the Review" ] },
      { "kind": "text", "text": "Scrum Guide: the Sprint Goal is the single objective and a commitment. The selected items are a forecast." }
    ]},
    { "heading": "In the zoo", "blocks": [
      { "kind": "callout",
        "lines": [ "Plan state, day 2:", "10 pts left · 1 day · goal needs the giraffe", "The Daily Scrum asks one question:" ],
        "emphasis": "can we still meet the goal?" },
      { "kind": "text", "text": "Answer it. Then drag the card." }
    ]}
  ],
  "remember": "Protect the goal. Bend the plan.",
  "remember_sub": [
    "The Sprint Goal is what you commit to.",
    "Everything else is how you meant to get there."
  ]
}
```
