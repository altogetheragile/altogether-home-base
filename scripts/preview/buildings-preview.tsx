/* One of every kind of building, side by side, for looking at.
 *   npx vite-node scripts/preview/buildings-preview.tsx > /tmp/b.html
 * Hand-run; nothing is committed from it. */
import './.node-shims.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialZooState } from '../../src/components/zooGame/config';
import type { BacklogItem, ZooGameState } from '../../src/components/zooGame/types';
import { IsoZoo } from '../../src/components/zooGame/IsoZoo';

const it = (o: Partial<BacklogItem>): BacklogItem => ({
  id: 'x', name: 'Thing', zone: 'Grounds', category: 'amenity', status: 'open',
  points: 3, acceptance: [], acConfirmed: [], tasks: [], ...o,
} as BacklogItem);

const kinds: [string, string, number, number][] = [
  ['cafe', 'Cafe', 130, 150], ['shop', 'Gift Shop', 330, 150], ['kiosk', 'Kiosk', 530, 150],
  ['toilets', 'Toilets', 700, 150], ['stall', 'Ice Cream Stall', 230, 400],
];
const state = {
  ...initialZooState(), zones: ['Grounds'],
  attendance: { Grounds: 0 },
  backlog: kinds.map(([t, name, x, y]) => it({
    id: t, name, template: t, pos: { x, y },
    design: { parts: { type: t, sign: 'on' }, colors: {} },
  })),
} as unknown as ZooGameState;

process.stdout.write(`<!doctype html><meta charset="utf-8">
<body style="margin:0;padding:12px;background:#eef1ee">
${[0, 1].map((t) => `<div style="margin-bottom:8px"><b style="font:600 13px system-ui">turn ${t}</b>${renderToStaticMarkup(<IsoZoo state={state} height={560} turn={t} />)}</div>`).join('')}</body>`);
