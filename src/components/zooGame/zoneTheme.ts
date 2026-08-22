/** The colours a zone lends to anything built in it, before anybody chooses their own.
 *
 *  Its own module because two places need it: the park, which draws the habitat, and the design
 *  bench, whose Ground and Fence swatches have to show what the habitat is actually wearing - a
 *  grey square for a tan fence is a lie.
 */
export interface ZoneTheme { plot: string; plotBorder: string }

const THEMES: Record<string, ZoneTheme> = {
  savanna: { plot: '#d9b98a', plotBorder: '#b7965f' },
  water: { plot: '#6db6d8', plotBorder: '#4f9cbf' },
  forest: { plot: '#93c977', plotBorder: '#6b8f4e' },
};
const ORDER = ['forest', 'savanna', 'water'];

export function themeFor(zone: string, idx: number): ZoneTheme {
  if (zone === 'Big Cats') return THEMES.savanna;
  if (zone === 'Waterside') return THEMES.water;
  return THEMES[ORDER[idx % ORDER.length]];
}
