/** Types for the extraction helpers, so a test in src/ can import them.
 *  The implementation is plain JavaScript because it runs under node, not vite. */
export function slim(markup: string): string;
export function topLevelGroups(svg: string): string[];
export function viewBoxOf(box: { x: number; y: number; w: number; h: number }, pad?: number): string;
export function measureGroups(browser: unknown, svg: string): Promise<{ x: number; y: number; w: number; h: number; n: number }[]>;
export function contactSheet(browser: unknown, groups: string[], boxes: unknown[], path: string): Promise<void>;
export function namespaceIds(markup: string, prefix: string): string | null;
