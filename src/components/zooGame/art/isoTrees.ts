import type { IsoProp } from './isoArt.generated';

// ============= The trees the sheet does not have =============
//
// The plan draws five kinds of tree and the isometric view drew one. Reported from playing it:
// "the views are out of sync - trees look different in the build view but the same on the
// isometric view."
//
// The licensed park sheet turned out to hold exactly ONE tree. It appears at half a dozen places in
// the scene and `treeProp` picked between two of those cuts believing they were different drawings;
// side by side they are the same tree. So a conifer, a palm and a bare tree have to be drawn, and
// these are they.
//
// Drawn in the sheet's own palette and in the same 39x65 box, so a pine standing next to an oak
// looks like it came out of the same set: the greens are lifted straight from the cut tree
// (#C1E52C lightest through #37560F darkest) and the bark is its #56321A. Flat faces, light from
// the upper left, no gradients - which is how the sheet is drawn.
//
// They go through `prop()` like any other prop, so placing, depth sorting, scaling and the foliage
// tint all work on them unchanged. A drawing is a drawing, wherever it came from.

const BARK = '#56321A';
const BARK_LIT = '#6E441F';

/** A conifer: three tiers, each a lit left face and a shaded right one. */
const pine: IsoProp = {
  viewBox: '0 0 39 65',
  w: 38.9,
  h: 64.6,
  body: [
    `<path fill="${BARK}" d="M17.4 65 L17.4 46 L21.6 46 L21.6 65 Z"/>`,
    // Bottom tier first, so each skirt above overlaps the one below it.
    `<polygon points="19.5,30 4.5,54 19.5,54" fill="#629D1B"/>`,
    `<polygon points="19.5,30 19.5,54 34.5,54" fill="#3E6610"/>`,
    `<polygon points="19.5,17 8,40 19.5,40" fill="#6DA51C"/>`,
    `<polygon points="19.5,17 19.5,40 31,40" fill="#477715"/>`,
    `<polygon points="19.5,4 11.5,26 19.5,26" fill="#8ACE29"/>`,
    `<polygon points="19.5,4 19.5,26 27.5,26" fill="#4E7F16"/>`,
  ].join(''),
};

/** A palm: a leaning trunk and fronds off the crown, with daylight between them. */
const palm: IsoProp = {
  viewBox: '0 0 39 65',
  w: 38.9,
  h: 64.6,
  body: [
    `<path fill="${BARK}" d="M15.8 65 C17 50 18.6 38 22.4 28.5 L26 29.8 C22.2 39.6 20.8 51.4 20 65 Z"/>`,
    `<path fill="${BARK_LIT}" d="M22.4 28.5 C20.4 33 19.4 36.4 18.6 40 L20.4 40.6 C21.2 36.8 22.4 33.4 24.2 29.2 Z"/>`,
    `<g fill="none" stroke-linecap="round" stroke-width="4.4">`,
    `<path stroke="#629D1B" d="M24 28 Q13 21 4 27"/>`,
    `<path stroke="#8ACE29" d="M24 28 Q15 14 9.5 5"/>`,
    `<path stroke="#B0D933" d="M24 28 Q25.5 13 22 3"/>`,
    `<path stroke="#6DA51C" d="M24 28 Q33 13 36.5 6"/>`,
    `<path stroke="#477715" d="M24 28 Q35 21 37 31"/>`,
    `<path stroke="#3E6610" d="M24 28 Q31 30 29.5 37"/>`,
    `</g>`,
    `<circle cx="24" cy="27.5" r="2.6" fill="${BARK}"/>`,
  ].join(''),
};

/** Bare: branches and no canopy at all, which is the whole of what it is. */
const bare: IsoProp = {
  viewBox: '0 0 39 65',
  w: 38.9,
  h: 64.6,
  body: [
    `<path fill="${BARK}" d="M16.6 65 L18.2 33 L21.2 33 L22.4 65 Z"/>`,
    `<g fill="none" stroke-linecap="round">`,
    `<path stroke="${BARK}" stroke-width="3" d="M19.4 36 L9.5 19"/>`,
    `<path stroke="${BARK_LIT}" stroke-width="3" d="M19.8 32 L20.6 10"/>`,
    `<path stroke="${BARK}" stroke-width="3" d="M20.4 37 L30.5 21"/>`,
    `<path stroke="${BARK}" stroke-width="2" d="M12.8 25 L8 20.5 M14.6 22 L16.5 13"/>`,
    `<path stroke="${BARK_LIT}" stroke-width="2" d="M20.2 18 L26 11 M20.4 22 L14.5 16"/>`,
    `<path stroke="${BARK}" stroke-width="2" d="M27 26 L32.5 25 M25 29 L25.5 20"/>`,
    `</g>`,
  ].join(''),
};

/** The drawn props, by the name `treeProp` asks for. */
export const DRAWN_TREES: Record<string, IsoProp> = { pine, palm, bare };
