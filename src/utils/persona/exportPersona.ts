import { Persona, FIELD_LABELS, PersonaField } from '@/types/persona';

export const toJson = (p: Persona): string => JSON.stringify(p, null, 2);

export const toMarkdown = (p: Persona): string => {
  const lines: string[] = ['# Persona', '', `## ${p.name || '(unnamed)'}`, ''];
  (['role', 'context', 'goals', 'pains', 'behaviours'] as PersonaField[]).forEach((k) => {
    if (p[k]) lines.push(`**${FIELD_LABELS[k]}:** ${p[k]}`, '');
  });
  if (p.quote) lines.push(`> ${p.quote}`, '');
  return lines.join('\n');
};

export const fileStem = (p: Persona): string => {
  const base = (p.name || 'persona')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'persona';
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
