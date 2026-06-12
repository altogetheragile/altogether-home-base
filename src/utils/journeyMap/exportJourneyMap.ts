import { JourneyMap, JOURNEY_ROWS } from '@/types/journeyMap';

export const toJson = (j: JourneyMap): string => JSON.stringify(j, null, 2);

export const toMarkdown = (j: JourneyMap): string => {
  const lines: string[] = ['# Journey Map', ''];
  if (j.personaName) lines.push(`**Persona:** ${j.personaName}`, '');
  j.stages.forEach((s) => {
    lines.push(`## ${s.name || '(unnamed stage)'}`, '');
    JOURNEY_ROWS.forEach((r) => {
      if (s[r.key]) lines.push(`**${r.label}:** ${s[r.key]}`, '');
    });
  });
  return lines.join('\n');
};

export const fileStem = (j: JourneyMap): string => {
  const base = (j.personaName ? `${j.personaName}-journey` : 'journey-map')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'journey-map';
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
