import { StoryMap } from '@/types/storyMap';

export const toJson = (m: StoryMap): string => JSON.stringify(m, null, 2);

export const toMarkdown = (m: StoryMap): string => {
  const lines: string[] = ['# User Story Map', ''];
  const sliceName = (id: string | null): string =>
    id ? (m.slices.find((s) => s.id === id)?.name || 'Not sliced') : 'Not sliced';

  m.slices.forEach((s) => {
    if (s.productGoal) lines.push(`**${s.name || 'Slice'} Product Goal:** ${s.productGoal}`);
  });
  if (m.slices.some((s) => s.productGoal)) lines.push('');

  m.backbone.forEach((step) => {
    lines.push(`## ${step.name || '(unnamed step)'}`, '');
    step.stories.forEach((story) => {
      lines.push(`### ${story.title || '(story not named yet)'}`, '');
      if (story.smaller.length === 0) lines.push('_No smaller stories yet._');
      story.smaller.forEach((c) => lines.push(`- ${c.title || '(untitled)'}  _(${sliceName(c.sliceId)})_`));
      lines.push('');
    });
  });
  return lines.join('\n');
};

export const fileStem = (m: StoryMap): string => {
  const first = m.backbone.find((b) => b.name.trim())?.name;
  const base = (first ? `${first}-story-map` : 'story-map')
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
