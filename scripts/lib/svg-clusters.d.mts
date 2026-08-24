/** Types for the cluster helpers, so a test in src/ can import them.
 *  The implementation is plain JavaScript because it runs under node, not vite. */
export interface Box { x: number; y: number; w: number; h: number }
export interface Island extends Box { members: number[]; n: number; name?: string }
export interface Pick { name: string; members: number[]; drop?: string[]; dropLargerThan?: number }
export interface Cut { name: string; body: string; box: Box | null }
export function findIslands(browser: unknown, svg: string, bridge?: number, ignoreLargerThan?: number): Promise<Island[]>;
export function regionsOf(browser: unknown, svg: string, regions: { name: string; box: number[]; inside?: number }[]): Promise<Island[]>;
export function cutIslands(browser: unknown, svg: string, picks: Pick[]): Promise<Cut[]>;
