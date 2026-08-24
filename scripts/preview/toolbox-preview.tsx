/* The Toolbox as it actually renders, so the pickers can be looked at.
 *   npx vite-node scripts/preview/toolbox-preview.tsx > /tmp/tb.html
 * The point is the previews: every card is the same size, so no animal may overflow one. */
import './.node-shims.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Toolbox } from '../../src/components/zooGame/Toolbox';

process.stdout.write(`<title>Toolbox</title>
<style>
/* Only the handful of Tailwind utilities the toolbox lays out with. */
.grid{display:grid}.gap-0{gap:0}.relative{position:relative}.absolute{position:absolute}
.flex{display:flex}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}
.items-center{align-items:center}.items-end{align-items:flex-end}.items-start{align-items:flex-start}
.justify-center{justify-content:center}.justify-between{justify-content:space-between}
.rounded-lg{border-radius:8px}.rounded-md{border-radius:6px}.rounded{border-radius:4px}
.border{border:1px solid #d9dece}.p-4{padding:16px}.p-3{padding:12px}.p-2{padding:8px}
.gap-2{gap:8px}.gap-3{gap:12px}.gap-1{gap:4px}.mb-2{margin-bottom:8px}.mt-2{margin-top:8px}
.w-full{width:100%}.text-left{text-align:left}
.grid-cols-2{grid-template-columns:repeat(2,1fr)}
.fixed{position:static}.inset-0{}.z-40{}.overflow-y-auto{}.bg-black\\/50{}.backdrop-blur-sm{}
body{margin:0;background:#eef1e9;font:14px/1.4 ui-sans-serif,system-ui,sans-serif;padding:16px}
button{background:#fff;border:1px solid #d9dece;border-radius:8px;padding:8px;text-align:left}
</style><body>${renderToStaticMarkup(<Toolbox onPick={() => {}} onClose={() => {}} />)}</body>`);
