/* The Definition of Done editor, rendered to a standalone HTML file so it can be looked at.
 *   npx vite-node scripts/preview/dod-preview.tsx > /tmp/dod.html
 * Run `npm run build` first: the page inlines the app's compiled stylesheet.
 * Hand-run; nothing is committed from it. */
import './.node-shims.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { DodEditor } from '../../src/components/zooGame/DodEditor';
import { DEFAULT_DOD } from '../../src/components/zooGame/config';

// The four a game starts with, plus one of each kind a team might add.
const dod = [...DEFAULT_DOD, 'Safe and accessible to all visitors', 'No known defects', 'Everyone on the team would take their kids to it'];

const dir = 'dist/assets';
const css = readdirSync(dir).filter((f) => /^index-.*\.css$/.test(f))
  .map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n');

process.stdout.write(`<!doctype html><meta charset="utf-8"><style>${css}</style>
<body style="margin:0;padding:24px;background:#f4f4f2">
<div style="max-width:720px">${renderToStaticMarkup(<DodEditor dod={dod} onSave={() => {}} />)}</div></body>`);
