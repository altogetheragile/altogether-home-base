import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Bubble } from './TeamChat';
import { RefineBacklog } from './RefineBacklog';
import { initialZooState, DEFAULT_BRIEF } from './config';
import { writeBacklog } from './engine';
import type { ChatMessage, ZooGameState } from './types';

// "Can all the speech prompts be highlighted for a player? To draw their eye so they see what to do
// next?" (Al, 25 November 2026). A line that hands over the next step carries a halo in the
// speaker's colour, and pulses when it changes. A line in the conversation does not: if everything
// is highlighted, nothing is.

const noop = () => {};
const msg = (text: string): ChatMessage => ({ id: 'm', who: 'product_owner', from: 'Priya', text, day: 1 });
const bubble = (loud: boolean, text = 'Here is my starter.') =>
  render(<ul><Bubble msg={msg(text)} loud={loud} /></ul>).container.querySelector('[data-part="chat-message"] span[class*="rounded-2xl"]') as HTMLElement;

describe('a speech prompt', () => {
  it('is highlighted in the speaker\'s colour', () => {
    const b = bubble(true);
    expect(b.className).toMatch(/\bzoo-prompt\b/);
    expect(b.style.getPropertyValue('--prompt'), 'no speaker colour for the halo').not.toBe('');
  });

  it('is not, for a line in the conversation', () => {
    expect(bubble(false).className).not.toMatch(/\bzoo-prompt\b/);
  });

  it('is the handover on the first screen', () => {
    const s = { ...writeBacklog(initialZooState(3), DEFAULT_BRIEF), phase: 'refine' } as ZooGameState;
    const page = render(<MemoryRouter>
      <RefineBacklog state={s} onSetSprintDays={noop} onSetDod={noop} onAgreeDod={noop} onEstimate={noop}
        onAddPbi={noop} onRefinePbi={noop} onReorder={noop} onMoveZone={noop} onMoveBefore={noop}
        onSetUseStories={noop} onSplitEpic={noop} onDeletePbi={noop} onDuplicatePbi={noop} onPlan={noop} />
    </MemoryRouter>).baseElement;
    expect(page.querySelector('[data-part="handover"] .zoo-prompt'), 'the handover line is not highlighted').not.toBeNull();
  });

  it('is Priya\'s proposal at the huddle, and every line of Sam\'s', () => {
    const src = (f: string) => readFileSync(`src/components/zooGame/${f}`, 'utf8');
    expect(src('Huddle.tsx')).toMatch(/id: 'huddle-proposal'[\s\S]{0,200}\bloud\b/);
    expect(src('SamSays.tsx')).toMatch(/className=\{cn\('zoo-prompt /);
  });

  it('keeps still for anyone who has asked for less motion, and keeps the halo', () => {
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.zoo-prompt \{ animation: none; \} \}/);
  });
});
