/* The plan view, rendered to a standalone HTML file so it can be looked at.
 *   npx vite-node scripts/preview/park-preview.tsx > /tmp/park.html
 *
 * The park is built out of Tailwind classes as well as inline styles, so the page inlines the app's
 * own compiled stylesheet - without it the drawing is there but none of it is in the right place,
 * which makes the preview worse than useless for judging a layout. Run `npm run build` first.
 *
 * Hand-run; nothing is committed from it.
 */
import './.node-shims.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { initialZooState } from '../../src/components/zooGame/config';
import type { BacklogItem, ZooGameState } from '../../src/components/zooGame/types';
import { ParkView } from '../../src/components/zooGame/ParkView';

const it = (o: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  points: 3, acceptance: [], acConfirmed: [], tasks: [], ...o,
} as BacklogItem);

const base = initialZooState();
const state = {
  ...base,
  zones: ['Big Cats', 'Savanna', 'Grounds'],
  attendance: { ...(base.attendance ?? {}), families: 500, enthusiasts: 250, comfortSeekers: 150 },
  backlog: [
    it({ id: 'e1', name: 'Lion Enclosure', enclosureSize: 'medium', pos: { x: 250, y: 210 },
         design: { parts: {}, colors: { ground: '#c9a86a', fence: '#7a5230' },
           water: [{ x: 0.6, y: 0.55, w: 0.3, h: 0.35 }],
           flora: [{ x: 0.18, y: 0.7, s: 1, type: 'oak' }] } }),
    it({ id: 'a1', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'e1',
         design: { parts: { group: 'family' }, colors: {} } }),
    it({ id: 'e2', name: 'Giraffe Enclosure', zone: 'Savanna', enclosureSize: 'large', pos: { x: 580, y: 300 } }),
    it({ id: 'a2', name: 'Giraffe', category: 'exhibit', template: 'giraffe', zone: 'Savanna', enclosureId: 'e2' }),
    it({ id: 'a3', name: 'Zebra', category: 'exhibit', template: 'zebra', zone: 'Savanna', enclosureId: 'e2' }),
    it({ id: 'e3', name: 'Toucan Aviary', zone: 'Savanna', enclosureSize: 'small', pos: { x: 660, y: 120 },
         status: 'committed', started: true }),
    it({ id: 'b1', name: 'Kiosk', category: 'amenity', template: 'kiosk', zone: 'Grounds', pos: { x: 400, y: 470 },
         design: { parts: { type: 'kiosk', sign: 'on' }, colors: { walls: '#efe6d8', roof: '#c0563f', door: '#7a5230', sign: '#e6a53a' } } }),
    it({ id: 'b2', name: 'Gift Shop', category: 'amenity', template: 'shop', zone: 'Grounds', pos: { x: 150, y: 430 },
         status: 'committed', started: true }),
    it({ id: 'f1', name: 'Signposts', category: 'flora', template: 'signpost', zone: 'Grounds', pos: { x: 330, y: 350 },
         copies: [{ x: 364, y: 350 }, { x: 330, y: 384 }] }),
    it({ id: 'f2', name: 'Planting', category: 'flora', template: 'oak', zone: 'Grounds', pos: { x: 120, y: 200 },
         copies: [{ x: 154, y: 200, piece: 'pine' }, { x: 120, y: 234, piece: 'blossom' }] }),
    it({ id: 'l1', name: 'River', category: 'flora', template: 'river', zone: 'Grounds', pos: { x: 410, y: 560 } }),
    it({ id: 'l2', name: 'Bridge', category: 'flora', template: 'bridge', zone: 'Grounds',
         pos: { x: 300, y: 560 }, size: { w: 74, h: 120 } }),
  ],
  connectors: [
    { id: 'c1', a: { featureId: 'e1', x: 250, y: 210 }, b: { featureId: 'b1', x: 400, y: 470 }, style: 'gravel', color: '#c9b189', thickness: 14, bends: [] },
    { id: 'c2', a: { featureId: 'e2', x: 580, y: 300 }, b: { featureId: 'b1', x: 400, y: 470 }, style: 'gravel', color: '#c9b189', thickness: 14, bends: [] },
  ],
} as unknown as ZooGameState;

const dir = 'dist/assets';
const css = readdirSync(dir).filter((f) => /^index-.*\.css$/.test(f))
  .map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n');

process.stdout.write(`<!doctype html><meta charset="utf-8"><style>${css}</style>
<body style="margin:0;padding:16px;background:#eef1ee">
<div style="max-width:1100px">${renderToStaticMarkup(<ParkView state={state} large />)}</div></body>`);
