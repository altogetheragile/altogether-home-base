import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// A legal page shows this site's own words where it has written some, this repository's company
// documents only on the site they belong to, and otherwise says it has not been published. The
// documents written into the App name one company's number and registered office.

let own: Record<string, string> | undefined = {};
let loading = false;
let publishes = false;

vi.mock('./legalText', () => ({ useOwnLegal: () => ({ data: own, isLoading: loading }) }));
vi.mock('./UnpublishedLegal', () => ({
  usePublishesLegal: () => publishes,
  UnpublishedLegal: ({ title }: { title: string }) => <p>{title} has not been published</p>,
}));
// The page around the words is the App's ordinary menu and footer; neither is under test here.
vi.mock('@/components/Navigation', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/hooks/useCompanyName', () => ({ useCompanyName: () => 'Stream Strategy' }));

const { useLegalStandIn } = await import('./legalStandIn');

function Page() {
  const standIn = useLegalStandIn('privacy', 'Privacy Notice');
  return <>{standIn ?? <p>the shipped document</p>}</>;
}

beforeEach(() => {
  own = {};
  loading = false;
  publishes = false;
});

describe('a legal page is the site’s own', () => {
  it('shows what the site has written, with its headings and bullets', () => {
    own = { privacy: '## Who We Are\n\nStream Strategy runs focus groups.\n\n- Your name\n- Your email' };
    render(<Page />);
    expect(screen.getByRole('heading', { name: 'Who We Are' })).toBeTruthy();
    expect(screen.getByText('Stream Strategy runs focus groups.')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('the shipped document')).toBeNull();
  });

  it('prefers the site’s own words even where the shipped document is switched on', () => {
    own = { privacy: 'Our own notice.' };
    publishes = true;
    render(<Page />);
    expect(screen.getByText('Our own notice.')).toBeTruthy();
  });

  it('shows the shipped document only on the site it belongs to', () => {
    publishes = true;
    render(<Page />);
    expect(screen.getByText('the shipped document')).toBeTruthy();
  });

  it('says it has not been published anywhere else', () => {
    render(<Page />);
    expect(screen.getByText('Privacy Notice has not been published')).toBeTruthy();
  });

  it('shows neither while it is still finding out', () => {
    loading = true;
    publishes = true;
    render(<Page />);
    expect(screen.queryByText('the shipped document')).toBeNull();
    expect(screen.queryByText(/has not been published/)).toBeNull();
  });

  it('never runs markup pasted into the text', () => {
    own = { privacy: 'Before <script>window.hacked = true</script> after' };
    const { container } = render(<Page />);
    expect(container.querySelector('script')).toBeNull();
  });
});
