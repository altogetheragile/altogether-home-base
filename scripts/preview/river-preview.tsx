/* A river laid at an angle, in both drawings. Hand-run. */
import './.node-shims.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialZooState } from '../../src/components/zooGame/config';
import type { BacklogItem, ZooGameState } from '../../src/components/zooGame/types';
import { IsoZoo } from '../../src/components/zooGame/IsoZoo';

const state = (rot: number, size?: { w: number; h: number }) => ({
  ...initialZooState(), zones: ['Grounds'], attendance: { Grounds: 300 },
  backlog: [{
    id: 'riv', name: 'River', zone: 'Grounds', category: 'flora', template: 'river',
    status: 'open', points: 1, acceptance: [], acConfirmed: [], tasks: [],
    rot, ...(size ? { size } : {}), pos: { x: 410, y: 330 },
    design: { parts: { type: 'river', piece: 'stream' }, colors: {} },
  } as unknown as BacklogItem],
} as unknown as ZooGameState);

const cases: [string, number, { w: number; h: number } | undefined][] = [
  ['bank to bank, flat (the default)', 0, undefined],
  ['swung round 30 degrees', 30, undefined],
  ['shortened to 320 and swung 55', 55, { w: 320, h: 54 }],
];

process.stdout.write(`<!doctype html><meta charset="utf-8">
<body style="margin:0;padding:10px;background:#eef1ee;font:600 13px system-ui">
${cases.map(([label, rot, size]) => `<div style="margin-bottom:6px">${label}
${renderToStaticMarkup(<IsoZoo state={state(rot, size)} height={330} />)}</div>`).join('')}</body>`);
