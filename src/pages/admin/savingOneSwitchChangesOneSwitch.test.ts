import { describe, it, expect } from 'vitest';
import { onlyWhatChanged } from './settingsChanges';

// Reported from the live site: "if I hide AI tools then all Resources disappear."
//
// The save sent every flag on the form. A column that is null means nobody has decided, and the
// page renders it with the code's default. Sending the whole form turned each of those into an
// explicit value, so switching AI Tools off also wrote show_knowledge=false and show_exams=false,
// because those are off by default for a new site and had never been set here.
//
//   before: ai_tools=true  knowledge=null  blog=null  exams=null
//   after:  ai_tools=false knowledge=FALSE blog=true  exams=FALSE
//
// Nothing said why. The Resources menu simply emptied.

describe('saving one switch changes one switch', () => {
  it('sends only the flag that moved', () => {
    const before = { show_ai_tools: true, show_knowledge: false, show_exams: false };
    const now = { ...before, show_ai_tools: false };
    expect(onlyWhatChanged(now, before)).toEqual({ show_ai_tools: false });
  });

  it('sends nothing when nothing moved', () => {
    const flags = { show_ai_tools: true, show_blog: true };
    expect(onlyWhatChanged(flags, { ...flags })).toEqual({});
  });

  it('never writes a flag whose switch was only showing a default', () => {
    // This is the whole bug. The form shows false for an unset flag because that is what the site
    // renders; saving must not turn "nobody decided" into "somebody decided no".
    const before = { show_ai_tools: true, show_knowledge: false, show_exams: false, show_blog: true };
    const now = { ...before, show_ai_tools: false };
    const sent = onlyWhatChanged(now, before);
    expect(Object.keys(sent)).not.toContain('show_knowledge');
    expect(Object.keys(sent)).not.toContain('show_exams');
    expect(Object.keys(sent)).not.toContain('show_blog');
  });

  it('sends several when several moved', () => {
    const before = { a: true, b: true, c: true };
    expect(onlyWhatChanged({ a: false, b: true, c: false }, before)).toEqual({ a: false, c: false });
  });

  it('sends a flag turned back on', () => {
    expect(onlyWhatChanged({ show_exams: true }, { show_exams: false })).toEqual({ show_exams: true });
  });
});
