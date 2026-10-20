import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoryMapEditor } from './StoryMapEditor';
import type { StoryMap } from '@/types/storyMap';

// The editor draws Al's three tiers: backbone, stories, smaller stories in priority order, with
// Now / Next / Later slices across the smaller stories, each with its own Product Goal.

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useProjectArtifacts', () => ({ useProjectArtifactMutations: () => ({ updateArtifact: { mutateAsync: vi.fn() } }) }));
vi.mock('@/components/coaching/CoachChat', () => ({ CoachChat: () => null }));
vi.mock('@/components/projects/SaveToProjectDialog', () => ({ SaveToProjectDialog: () => null }));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const MAP: StoryMap = {
  version: 2,
  slices: [
    { id: 'now', name: 'Now', productGoal: 'We believe online tickets will fill opening weekend.' },
    { id: 'next', name: 'Next', productGoal: '' },
  ],
  backbone: [{ id: 'b1', name: 'Plan the visit', stories: [{ id: 's1', title: 'Purchase tickets', smaller: [
    { id: 'x1', title: 'Select ticket', sliceId: 'now' },
    { id: 'x2', title: 'Check out securely', sliceId: 'now' },
  ] }] }],
};

const show = () => render(<MemoryRouter><StoryMapEditor initialData={MAP} artifactId="a" projectId="p" /></MemoryRouter>);
const smaller = () => screen.getAllByLabelText('Smaller story').map((t) => (t as HTMLTextAreaElement).value);

describe('the map is sliced into goals', () => {
  beforeEach(() => localStorage.clear());

  it('draws the backbone, the story under it and the smaller stories', () => {
    show();
    expect((screen.getByLabelText('Backbone step') as HTMLInputElement).value).toBe('Plan the visit');
    expect((screen.getByLabelText('Story') as HTMLTextAreaElement).value).toBe('Purchase tickets');
    expect(smaller()).toEqual(['Select ticket', 'Check out securely']);
  });

  it('gives each slice its own Product Goal', () => {
    show();
    expect((screen.getByLabelText('Now Product Goal') as HTMLTextAreaElement).value).toMatch(/online tickets/);
    expect((screen.getByLabelText('Next Product Goal') as HTMLTextAreaElement).value).toBe('');
  });

  it('raises a smaller story in priority by moving it up its column', () => {
    show();
    fireEvent.click(screen.getAllByLabelText('Higher priority')[1]);
    expect(smaller()).toEqual(['Check out securely', 'Select ticket']);
  });

  it('sends the slice at the top, and Next becomes Now when moved up', () => {
    show();
    expect(screen.getByRole('button', { name: /Send Now to Backlog/ })).toBeTruthy();
    const next = screen.getByLabelText('Next Product Goal').closest('div')!.parentElement!;
    fireEvent.click(within(next).getByLabelText('Move slice up'));
    expect(screen.getByRole('button', { name: /Send Next to Backlog/ })).toBeTruthy();
  });

  it('adds a smaller story straight into the slice it was added in', () => {
    show();
    fireEvent.click(screen.getAllByRole('button', { name: /Add smaller story/ })[1]); // the Next row
    const selects = screen.getAllByLabelText('Slice') as HTMLSelectElement[];
    expect(selects.map((s) => s.value)).toEqual(['now', 'now', 'next']);
  });
});
