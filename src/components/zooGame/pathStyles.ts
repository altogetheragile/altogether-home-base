// The surfaces the park paths + entrance promenade can be laid in. `road`/`edge` colour the
// spurs to each enclosure; `promenade` is the entrance band's gradient; `dash` is the painted
// centre-line (null = no centre-line, e.g. planks). Keys are stored on state.pathStyle.
export interface PathStyle { key: string; label: string; road: string; edge: string; dash: string | null; promenade: [string, string] }

export const PATH_STYLES: PathStyle[] = [
  { key: 'gravel', label: 'Gravel', road: '#dccbaa', edge: '#b9a578', dash: 'rgba(255,255,255,.35)', promenade: ['#d9c7a6', '#cdb98f'] },
  { key: 'paved', label: 'Paved', road: '#c3c7cc', edge: '#9aa0a7', dash: 'rgba(255,255,255,.55)', promenade: ['#cdd1d6', '#b4bac1'] },
  { key: 'sand', label: 'Sand', road: '#ecd9a6', edge: '#cdb877', dash: null, promenade: ['#ecdcae', '#dcc888'] },
  { key: 'boardwalk', label: 'Boardwalk', road: '#c79a5e', edge: '#9c6f3a', dash: 'rgba(60,35,10,.30)', promenade: ['#c99b5e', '#a87940'] },
  { key: 'brick', label: 'Brick', road: '#c17a5c', edge: '#96543b', dash: 'rgba(255,255,255,.28)', promenade: ['#c48065', '#a45f45'] },
];

export const pathStyleFor = (key: string | undefined): PathStyle => PATH_STYLES.find((s) => s.key === key) ?? PATH_STYLES[0];
