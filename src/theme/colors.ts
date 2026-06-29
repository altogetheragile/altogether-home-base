// ─── Altogether Agile brand palette ──────────────────────────────────────────
// The single source of truth now lives in the shared design-system package
// (@altogether/ui), consumed by both the Vite App and the Next.js Site and synced
// to Claude Design. Re-exported here so existing `import { colors } from '@/theme/colors'`
// keeps working unchanged.

export { colors, fonts, radii, fontWeights, space, tokens } from '@altogether/ui/tokens';
export type { ColorToken } from '@altogether/ui/tokens';
