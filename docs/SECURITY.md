# Security notes

## Dependency vulnerabilities (reviewed 2026-06-30)

`npm audit fix` (non-force, semver-compatible) was applied to the App (root). It resolved
the genuinely runtime/security-relevant advisories: **dompurify** (the HTML/XSS sanitizer),
**react-router / @remix-run/router**, **form-data** (CRLF injection), **lodash/lodash-es**,
glob, brace-expansion, ws, rollup, picomatch, minimatch. The Next Site (`apps/web`) had no
high/critical.

### Remaining App advisories — reviewed, deliberately deferred

| Package | Sev | Why deferred |
|---|---|---|
| `@resvg/resvg-js` deps: `@mapbox/node-pre-gyp`, `canvas`, `tar` | high | **Build-only.** Used by `scripts/prerender.mjs` to render exam OG images on the Vercel build server. Never shipped to a browser. The fixes are breaking and would risk OG-image generation. |
| `vite` | high | **Build/dev-only** (path traversal in the dev server's optimized-deps handling). Not in the production bundle. Breaking to fix (major bump). |
| `fabric` | high | **Runtime** (BMC generator). "Stored XSS via SVG export." Real but narrow: BMC content is the user's own data; exploit needs a malicious collaborator on a shared project. Fix is a breaking v6→v7 bump that risks the canvas tool. Address with feature testing. |
| `jspdf` | critical | **Runtime** (PDF export). LFI/path-traversal — primarily a server/Node concern; jsPDF runs client-side here (sandboxed, no server FS), so real exploitability is low. Fix is a breaking major bump that risks PDF export. Address with feature testing. |
| `xlsx` (SheetJS) | high | **Runtime** (spreadsheet export). Prototype pollution / ReDoS on *parse*. **No npm fix** (SheetJS publishes fixes only via their own CDN). Low risk if the app only *exports* (generates) and does not *parse* untrusted .xlsx uploads — verify usage before migrating to the CDN build. |

**Recommended follow-up:** bump `fabric`, `jspdf` to their latest majors and migrate `xlsx`
to the SheetJS CDN distribution, each verified by exercising the affected export (BMC SVG/PNG,
PDF, spreadsheet) — not blind, because they back working features.
