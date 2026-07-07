import { StoryMap } from '@/types/storyMap';

export const toJson = (m: StoryMap): string => JSON.stringify(m, null, 2);

export const toMarkdown = (m: StoryMap): string => {
  const lines: string[] = ['# User Story Map', ''];
  if (m.productGoal) lines.push(`**Product goal:** ${m.productGoal}`, '');

  const releaseName = (id: string | null): string =>
    id ? (m.releases.find((r) => r.id === id)?.name || 'Unscheduled') : 'Unscheduled';

  m.activities.forEach((a) => {
    lines.push(`## ${a.name || '(unnamed activity)'}`, '');
    if (a.cards.length === 0) {
      lines.push('_No stories yet._', '');
      return;
    }
    a.cards.forEach((c) => {
      lines.push(`- ${c.title || '(untitled)'}  _(${releaseName(c.releaseId)})_`);
    });
    lines.push('');
  });
  return lines.join('\n');
};

export const fileStem = (m: StoryMap): string => {
  const base = (m.productGoal ? `${m.productGoal}-story-map` : 'story-map')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'story-map';
};

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
