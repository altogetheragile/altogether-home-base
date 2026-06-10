import { ImpactMap, LEVEL_META } from '@/types/impactMap';

/** Escape a string for use inside an XML attribute / text node. */
const xmlEscape = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Export to FreeMind .mm (XML), which opens in FreeMind, Freeplane, and
 * MindManager. Impact maps are trees, so they map cleanly onto a mind map:
 * goal -> actors -> impacts -> deliverables. Levels are colour-coded.
 */
export const toFreeMind = (map: ImpactMap): string => {
  const node = (text: string, color: string, children: string[], position?: 'right'): string => {
    const attrs = [
      `TEXT="${xmlEscape(text || ' ')}"`,
      `COLOR="${color}"`,
      position ? `POSITION="${position}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (children.length === 0) return `<node ${attrs}/>`;
    return `<node ${attrs}>\n${children.join('\n')}\n</node>`;
  };

  const actorNodes = (map.actors ?? []).map((actor) =>
    node(
      actor.label,
      LEVEL_META.actor.color,
      actor.impacts.map((impact) =>
        node(
          impact.label,
          LEVEL_META.impact.color,
          impact.deliverables.map((d) => node(d.label, LEVEL_META.deliverable.color, [])),
        ),
      ),
      'right',
    ),
  );

  const root = node(map.goal || 'Goal', LEVEL_META.goal.color, actorNodes);

  return `<map version="1.0.1">\n${root}\n</map>\n`;
};

/** Export to a Markdown outline. */
export const toMarkdown = (map: ImpactMap): string => {
  const lines: string[] = [];
  lines.push(`# Impact Map`);
  lines.push('');
  lines.push(`**Goal (Why):** ${map.goal || '_(not set)_'}`);
  lines.push('');
  for (const actor of map.actors ?? []) {
    lines.push(`- **${actor.label || '(actor)'}** _(Who)_`);
    for (const impact of actor.impacts) {
      lines.push(`  - ${impact.label || '(impact)'} _(How)_`);
      for (const d of impact.deliverables) {
        lines.push(`    - ${d.label || '(deliverable)'} _(What)_`);
      }
    }
  }
  lines.push('');
  return lines.join('\n');
};

/** Export to JSON (pretty-printed) for saving and re-importing. */
export const toJson = (map: ImpactMap): string => JSON.stringify(map, null, 2);

/** Trigger a browser download of a text payload. */
export const downloadText = (text: string, filename: string, mime: string): void => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Build a filesystem-safe filename stem from the goal. */
export const fileStem = (map: ImpactMap): string => {
  const base = (map.goal || 'impact-map')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'impact-map';
};
