import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveToProjectDialog } from './SaveToProjectDialog';

// Dogfooding the PO route: a canvas opened from inside Build A Zoo still put the whole
// initiative picker in front of the save, and its cards spilled past the dialog's right edge.

const createArtifact = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({
    data: [
      { id: 'zoo', name: 'Build A Zoo', description: 'x'.repeat(300), color_theme: '#10B981' },
      { id: 'other', name: 'Something Else', description: null, color_theme: null },
    ],
    isLoading: false,
  }),
  useProjectMutations: () => ({ createProject: { mutateAsync: vi.fn(), isPending: false } }),
}));
vi.mock('@/hooks/useProjectArtifacts', () => ({
  useProjectArtifactMutations: () => ({ createArtifact: { mutateAsync: createArtifact, isPending: false } }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const open = (preselectedProjectId?: string) =>
  render(
    <SaveToProjectDialog
      open
      onOpenChange={() => {}}
      artifactType="product-vision"
      artifactName="Product Vision Canvas"
      artifactData={{}}
      preselectedProjectId={preselectedProjectId}
    />,
  );

describe('the save dialog knows its initiative', () => {
  beforeEach(() => {
    createArtifact.mockReset();
    createArtifact.mockResolvedValue({ id: 'a1' });
  });

  it('names the initiative it was opened from instead of asking again', () => {
    open('zoo');
    expect(screen.getByText('Build A Zoo')).toBeTruthy();
    expect(screen.queryByText('Something Else')).toBeNull();
    expect(screen.queryByText('Save to existing initiative')).toBeNull();
  });

  it('saves there in one press', async () => {
    open('zoo');
    fireEvent.click(screen.getByRole('button', { name: 'Save to Initiative' }));
    await vi.waitFor(() => expect(createArtifact).toHaveBeenCalled());
    expect(createArtifact.mock.calls[0][0].project_id).toBe('zoo');
  });

  it('can still be pointed somewhere else', () => {
    open('zoo');
    fireEvent.click(screen.getByRole('button', { name: 'Choose another initiative' }));
    expect(screen.getByText('Something Else')).toBeTruthy();
  });

  it('asks when it was not opened from an initiative', () => {
    open();
    expect(screen.getByText('Save to existing initiative')).toBeTruthy();
  });

  it('keeps the initiative cards inside the dialog', () => {
    open();
    const card = screen.getByRole('button', { name: /Build A Zoo/ });
    expect(card.className).toContain('w-full');
    expect(card.closest('[data-radix-scroll-area-viewport]')).toBeNull();
  });
});
