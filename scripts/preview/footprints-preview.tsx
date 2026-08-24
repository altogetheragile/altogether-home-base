/* Every kind of thing that stands on the grounds, at the size it takes up, side by side.
 *   npx tsx --tsconfig tsconfig.app.json scripts/preview/footprints-preview.tsx > /tmp/fp.html
 * The point of the page is the comparison: a cafe should plainly be a bigger thing than a kiosk,
 * and a signpost should plainly be a post. */
import './.node-shims.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BacklogItem } from '../../src/components/zooGame/types';
import { FOOTPRINT, footprintFor } from '../../src/components/zooGame/design';
import { Plot } from '../../src/components/zooGame/ParkView';

const KIND: Record<string, { name: string; category: BacklogItem['category'] }> = {
  signpost: { name: 'Signpost', category: 'flora' },
  flowers: { name: 'Flowerbed', category: 'flora' },
  bush: { name: 'Bushes', category: 'flora' },
  tree: { name: 'Trees', category: 'flora' },
  kiosk: { name: 'Kiosk', category: 'amenity' },
  stall: { name: 'Picnic Area', category: 'amenity' },
  toilets: { name: 'Toilets', category: 'amenity' },
  shop: { name: 'Gift Shop', category: 'amenity' },
  cafe: { name: 'Cafe', category: 'amenity' },
};

// The colours a player would have chosen in the studio; a built feature always has some.
const COLOURS: Record<string, Record<string, string>> = {
  amenity: { walls: '#efe6d8', roof: '#c0563f', door: '#7a5230', sign: '#e6a53a' },
  flora: { foliage: '#4a9b3f', trunk: '#7a5230' },
};

const item = (type: string): BacklogItem => ({
  id: type, name: KIND[type].name, zone: 'General', category: KIND[type].category,
  status: 'open', points: 3, acceptance: [], acConfirmed: [], tasks: [], template: type,
  design: { parts: { type, sign: 'on' }, colors: COLOURS[KIND[type].category] },
} as unknown as BacklogItem);

const order = Object.keys(FOOTPRINT).sort((a, b) => FOOTPRINT[a].w * FOOTPRINT[a].h - FOOTPRINT[b].w * FOOTPRINT[b].h);
const cells = order.map((t) => {
  const fp = footprintFor(item(t));
  return `<figure class="cell">
    <div class="stage" style="width:${fp.w}px;height:${fp.h}px">${renderToStaticMarkup(<Plot item={item(t)} named={false} />)}</div>
    <figcaption><b>${KIND[t].name}</b><span>${fp.w}&times;${fp.h}</span></figcaption>
  </figure>`;
}).join('');

process.stdout.write(`<title>Footprints</title>
<style>
/* The component is styled with Tailwind classes, and this page has no Tailwind. Only the handful
   the plot itself uses are needed for it to lay out. */
.grid{display:grid}.gap-0{gap:0}.relative{position:relative}
.flex{display:flex}.flex-col{flex-direction:column}
.items-center{align-items:center}.justify-center{justify-content:center}
.rounded-lg{border-radius:8px}

body{margin:0;padding:22px;background:#8cc063;font:14px/1.4 ui-sans-serif,system-ui,sans-serif}
.row{display:flex;flex-wrap:wrap;align-items:flex-end;gap:26px}
.cell{margin:0;display:flex;flex-direction:column;align-items:center;gap:7px}
.stage{display:flex;align-items:center;justify-content:center;outline:1px dashed rgba(0,0,0,.25)}
figcaption{display:flex;flex-direction:column;align-items:center;color:#1c2a14}
figcaption b{font-size:12.5px}
figcaption span{font:11px ui-monospace;color:#38502a}
</style><body><div class="row">${cells}</div></body>`);
