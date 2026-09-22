import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

// The palette is written down once, in @altogether/ui/tokens.
//
// It was already the stated architecture - `src/theme/colors.ts` re-exports the package, and the
// Next Site spreads it as CSS variables - and 41 files hardcoded the hex anyway. A rebrand was a
// find-and-replace rather than a config change, which is the opposite of what a token system is
// for, and the kind of thing nobody notices until they try to sell the thing.
//
// The Site is clean. The App is not yet, so the files that still need converting are listed rather
// than ignored: nothing NEW can hardcode a brand colour, and this list only ever shrinks.

const BRAND = ['#004D4D', '#007A7A', '#FF9715', '#F0FAFA', '#D9F2F2', '#B2DFDF'];

/** Where the palette is allowed to be written as hex, because this is where it is defined. */
const SOURCE_OF_TRUTH = ['packages/ui/src/tokens.ts'];

/** Still to convert. Deleting a line here is the whole job for that file. */
const NOT_YET = [
  'src/components/AboutSection.tsx',
  'src/components/AlunTabletPortrait.tsx',
  'src/components/CoursePlayer.css',
  'src/components/CoursePlayer.tsx',
  'src/components/HumaanisCycler.tsx',
  'src/components/backlog/StoryMap.tsx',
  'src/components/benefitsScorecard/BenefitsScorecardEditor.tsx',
  'src/components/bmc/CoachedBMCEditor.tsx',
  'src/components/canvases/CoachedCanvasEditor.tsx',
  'src/components/coaching/CoachChat.tsx',
  'src/components/coachingStudio/CoachingStudioEditor.tsx',
  'src/components/journeyMap/JourneyMapEditor.tsx',
  'src/components/knowledge-base/ValueHorizonsMap.tsx',
  'src/components/persona/PersonaEditor.tsx',
  'src/components/pipeline/JourneyBand.tsx',
  'src/components/probeTracker/ProbeTrackerEditor.tsx',
  'src/components/storyMap/StoryMapEditor.tsx',
  'src/components/testimonials/TestimonialComponents.tsx',
  'src/components/waysOfWorking/WaysOfWorkingEditor.tsx',
  'src/config/canvases.ts',
  'src/config/toolIcons.ts',
  'src/pages/KnowledgeBaseTechniques.tsx',
  'src/types/impactMap.ts',
  'src/types/journeyMap.ts',
  'src/types/persona.ts',
];

/** Files carrying a brand colour as a literal hex value.
 *
 *  Tests are excluded: this one names all six in order to look for them, and a test asserting
 *  something about a colour has to be able to write it down. */
function offenders(): string[] {
  const pattern = BRAND.join('\\|');
  const out = execSync(
    `grep -rl "${pattern}" src apps/web/src packages/ui/src --include=*.ts --include=*.tsx --include=*.css 2>/dev/null || true`,
    { encoding: 'utf8' },
  );
  return out.split('\n').filter(Boolean).filter((f) => !/\.test\.[jt]sx?$/.test(f)).sort();
}

describe('the brand palette', () => {
  it('is hardcoded only where it is defined, or where it is still being converted', () => {
    const allowed = new Set([...SOURCE_OF_TRUTH, ...NOT_YET]);
    const strays = offenders().filter((f) => !allowed.has(f));
    expect(strays, `hardcoded brand colours: ${strays.join(', ')}. Import from '@/theme/colors' (App) or '@/lib/brand' (Site), or use var(--aa-*)`).toEqual([]);
  });

  it('has no stale entries on the list of files still to convert', () => {
    const current = new Set(offenders());
    const done = NOT_YET.filter((f) => !current.has(f));
    expect(done, `already converted, remove from NOT_YET: ${done.join(', ')}`).toEqual([]);
  });

  it('is entirely absent from the Site, which is converted', () => {
    const site = offenders().filter((f) => f.startsWith('apps/web/'));
    expect(site, `the Site is meant to be clean: ${site.join(', ')}`).toEqual([]);
  });
});
