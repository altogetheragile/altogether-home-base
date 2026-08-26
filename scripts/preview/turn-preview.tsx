/* One building at each quarter turn, so the front can be seen going round. Hand-run. */
import './.node-shims.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialZooState } from '../../src/components/zooGame/config';
import type { BacklogItem, ZooGameState } from '../../src/components/zooGame/types';
import { IsoZoo } from '../../src/components/zooGame/IsoZoo';

const state = (rot: number) => ({
  ...initialZooState(), zones: ['Grounds'], attendance: { Grounds: 0 },
  backlog: [
    { id: 'cafe', name: 'Cafe', zone: 'Grounds', category: 'amenity', template: 'cafe',
      status: 'open', points: 1, acceptance: [], acConfirmed: [], tasks: [], rot,
      pos: { x: 200, y: 200 }, design: { parts: { type: 'cafe', sign: 'on' }, colors: {} } },
    { id: 'shop', name: 'Gift Shop', zone: 'Grounds', category: 'amenity', template: 'shop',
      status: 'open', points: 1, acceptance: [], acConfirmed: [], tasks: [], rot,
      pos: { x: 470, y: 200 }, design: { parts: { type: 'shop', sign: 'on' }, colors: {} } },
    { id: 'enc', name: 'Lion Enclosure', zone: 'Grounds', category: 'enclosure', enclosureSize: 'medium',
      status: 'open', points: 1, acceptance: [], acConfirmed: [], tasks: [], rot,
      pos: { x: 330, y: 400 }, design: { parts: {}, colors: { ground: '#c9a86a', fence: '#7a5230' } } },
  ] as unknown as BacklogItem[],
} as unknown as ZooGameState);

process.stdout.write(`<!doctype html><meta charset="utf-8">
<body style="margin:0;padding:10px;background:#eef1ee;font:600 13px system-ui">
${[0, 90, 180, 270].map((r) => `<div>turned ${r}
${renderToStaticMarkup(<IsoZoo state={state(r)} height={340} />)}</div>`).join('')}</body>`);
