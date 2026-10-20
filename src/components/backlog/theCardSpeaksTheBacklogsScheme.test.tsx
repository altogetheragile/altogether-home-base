import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalBacklogItemCard } from './LocalBacklogItemCard';
import { SchemeProvider } from './SchemeContext';
import type { SchemeId } from '@/config/prioritisationSchemes';
import type { LocalBacklogItem } from '@/hooks/useLocalBacklogItems';

// The Build A Zoo backlog runs on MoSCoW and every card said "medium": the card printed the
// stored word with its own colours whatever the scheme. It now speaks the backlog's scheme, and
// like the zoo game's card it shows "?" until the item is sized and where it is in its journey.

const item = (more: Partial<LocalBacklogItem> = {}): LocalBacklogItem => ({
  id: 'a', title: 'An item', description: null, acceptance_criteria: null, priority: 'medium',
  status: 'idea', source: 'enhancement', estimated_value: null, estimated_effort: null, tags: null,
  target_release: null, backlog_position: 0, item_type: 'story', parent_item_id: null, ...more,
});

const show = (scheme: SchemeId, it: LocalBacklogItem) =>
  render(
    <SchemeProvider scheme={scheme}>
      <LocalBacklogItemCard item={it} index={0} onUpdate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
    </SchemeProvider>,
  );

describe('the card speaks the backlog\'s scheme', () => {
  it('says Could, not medium, under MoSCoW', () => {
    show('moscow', item());
    expect(screen.getByText('Could')).toBeTruthy();
    expect(screen.queryByText('medium')).toBeNull();
  });

  it('shows a MoSCoW word as itself', () => {
    show('moscow', item({ priority: 'must' }));
    expect(screen.getByText('Must')).toBeTruthy();
  });

  it('shows the WSJF score, or that there is none yet', () => {
    show('wsjf', item({ priority_data: { business_value: 8, time_criticality: 5, risk_opportunity: 3, job_size: 4 } }));
    expect(screen.getByText('WSJF 4.0')).toBeTruthy();
  });

  it('asks for a WSJF score it does not have', () => {
    show('wsjf', item());
    expect(screen.getByText('WSJF ?')).toBeTruthy();
  });

  it('shows ? until the item is sized, and the points once it is', () => {
    const { unmount } = show('simple', item());
    expect(screen.getByTitle(/Not sized yet/).textContent).toBe('?');
    unmount();
    show('simple', item({ estimated_effort: 3 }));
    // As on the zoo's list rows: the number, titled as a size
    expect(screen.getByTitle('Size, in points').textContent).toBe('3');
  });

  it('names the source once', () => {
    show('simple', item());
    expect(screen.getAllByText('Enhancement')).toHaveLength(1);
  });
});
