/* Renders the isometric showcase to a standalone HTML file, for looking at.
 *   npx tsx scripts/preview/iso-preview.tsx > /tmp/iso.html
 * Handy because a zoo with one of everything in it takes twenty minutes to build by hand. */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialZooState } from '../../src/components/zooGame/config';
import type { BacklogItem, ZooGameState } from '../../src/components/zooGame/types';
import { IsoZoo } from '../../src/components/zooGame/IsoZoo';

const it = (o: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Big Cats', category: 'enclosure', status: 'open',
  points: 3, acceptance: [], acConfirmed: [], tasks: [], ...o,
} as BacklogItem);

const base = initialZooState();
const state = {
  ...base,
  zones: ['Big Cats', 'Savanna'],
  attendance: { 'Big Cats': 520, Savanna: 430 },
  backlog: [
    it({ id: 'e1', name: 'Lion Enclosure', enclosureSize: 'medium', pos: { x: 250, y: 210 },
         design: { parts: {}, colors: {}, flora: [{ x: 0.18, y: 0.7, s: 1, type: 'oak' }, { x: 0.8, y: 0.28, s: 0.9, type: 'bush' }] } }),
    it({ id: 'a1', name: 'Lion', category: 'exhibit', template: 'lion', enclosureId: 'e1', design: { parts: { group: 'family' }, colors: {} } }),
    it({ id: 'e2', name: 'Giraffe Enclosure', zone: 'Savanna', enclosureSize: 'large', pos: { x: 580, y: 300 } }),
    it({ id: 'a2', name: 'Giraffe', category: 'exhibit', template: 'giraffe', zone: 'Savanna', enclosureId: 'e2' }),
    it({ id: 'a3', name: 'Zebra', category: 'exhibit', template: 'zebra', zone: 'Savanna', enclosureId: 'e2' }),
    it({ id: 'e3', name: 'Toucan Aviary', zone: 'Savanna', enclosureSize: 'small', pos: { x: 640, y: 130 } }),
    it({ id: 'a4', name: 'Toucan', category: 'exhibit', template: 'toucan', zone: 'Savanna', enclosureId: 'e3' }),
    it({ id: 'b1', name: 'Kiosk', category: 'amenity', template: 'kiosk', pos: { x: 400, y: 470 },
         design: { parts: { type: 'kiosk', sign: 'on' }, colors: { walls: '#efe6d8', roof: '#c0563f', door: '#7a5230', sign: '#e6a53a' } } }),
    it({ id: 'b2', name: 'Gift Shop', category: 'amenity', template: 'shop', pos: { x: 170, y: 430 },
         design: { parts: { type: 'shop', sign: 'on' }, colors: { walls: '#dfe6ea', roof: '#4d7ea8', door: '#6b4a2f', sign: '#e6a53a' } } }),
    it({ id: 'b3', name: 'Signpost', category: 'amenity', template: 'signpost', pos: { x: 330, y: 360 }, design: { parts: { type: 'signpost' }, colors: {} } }),
    it({ id: 'f1', name: 'Big Cats Planting', category: 'flora', template: 'oak', pos: { x: 120, y: 200 }, design: { parts: { type: 'oak' }, colors: {} } }),
    it({ id: 'f2', name: 'Avenue', category: 'flora', template: 'blossom', pos: { x: 430, y: 120 }, design: { parts: { type: 'blossom' }, colors: {} } }),
    it({ id: 'f3', name: 'Hedging', category: 'flora', template: 'hedge', pos: { x: 700, y: 430 }, design: { parts: { type: 'hedge' }, colors: {} } }),
    // The landscape: a river the full width of the park, a bridge over it, and a planting that is
    // several trees rather than one - the three things this view used to get wrong.
    it({ id: 'l1', name: 'River', category: 'flora', template: 'river', pos: { x: 410, y: 560 }, design: { parts: { type: 'river' }, colors: {} } }),
    // Long across the river, not along it - a bridge is for getting to the other side.
    it({ id: 'l2', name: 'Bridge', category: 'flora', template: 'bridge', pos: { x: 300, y: 560 }, size: { w: 74, h: 120 }, design: { parts: { type: 'bridge' }, colors: {} } }),
    it({ id: 'f4', name: 'Signposts', category: 'flora', template: 'signpost', pos: { x: 520, y: 200 },
         design: { parts: { type: 'signpost' }, colors: {} },
         copies: [{ x: 364, y: 350 }, { x: 330, y: 384 }, { x: 296, y: 350 }] }),
    it({ id: 'f5', name: 'Orchard', category: 'flora', template: 'tree', pos: { x: 120, y: 330 },
         design: { parts: { type: 'tree' }, colors: {} },
         copies: [{ x: 154, y: 200, piece: 'pine' }, { x: 120, y: 234, piece: 'blossom' }, { x: 154, y: 234, piece: 'palm' }] }),
  ],
  connectors: [
    { id: 'c1', a: { featureId: 'e1', x: 250, y: 210 }, b: { featureId: 'b1', x: 400, y: 470 }, style: 'gravel' },
    { id: 'c2', a: { featureId: 'e2', x: 580, y: 300 }, b: { featureId: 'b1', x: 400, y: 470 }, style: 'gravel' },
  ],
} as unknown as ZooGameState;

process.stdout.write(`<title>Iso preview</title><body style="margin:0;background:#eef1e9;padding:16px">
<div style="max-width:1100px">${renderToStaticMarkup(<IsoZoo state={state} height={640} />)}</div></body>`);
