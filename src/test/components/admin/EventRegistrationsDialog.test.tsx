import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventRegistrationsDialog from '@/components/admin/events/EventRegistrationsDialog';
import { createMockRegistrationWithUser, mockClipboard } from '@/test/utils/testHelpers';

// Mock dependencies
vi.mock('@/hooks/useEventRegistrations', () => ({
  useEventRegistrations: vi.fn(),
  useDeleteRegistration: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/utils/stripe', () => ({
  getStripeDashboardSearchUrl: vi.fn((sessionId) => `https://stripe.com/search?q=${sessionId}`),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('EventRegistrationsDialog', () => {
  const mockUseEventRegistrations = require('@/hooks/useEventRegistrations').useEventRegistrations;
  const mockUseDeleteRegistration = require('@/hooks/useEventRegistrations').useDeleteRegistration;
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard();
    require('@/hooks/use-toast').useToast.mockReturnValue({ toast: mockToast });
    mockUseDeleteRegistration.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders dialog when open', () => {
    mockUseEventRegistrations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Registrations for Test Event')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    mockUseEventRegistrations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={false}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Registrations for Test Event')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseEventRegistrations.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    // Check for skeleton loading indicators
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays registration data correctly', () => {
    const mockRegistrations = [
      createMockRegistrationWithUser(
        {
          id: 'reg-1',
          registered_at: '2023-01-15T10:30:00Z',
          payment_status: 'paid',
          stripe_session_id: 'cs_test_123456789',
        },
        {
          id: 'user-1',
          full_name: 'John Doe',
          email: 'john@example.com',
        }
      ),
    ];

    mockUseEventRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2023 at 10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('handles missing user data gracefully', () => {
    const mockRegistrations = [
      createMockRegistrationWithUser(
        {
          id: 'reg-1',
          registered_at: '2023-01-15T10:30:00Z',
          payment_status: 'paid',
          stripe_session_id: 'cs_test_123456789',
        },
        undefined as any
      ),
    ];
    mockRegistrations[0].user = null;

    mockUseEventRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Unknown User')).toBeInTheDocument();
    expect(screen.getByText('No email')).toBeInTheDocument();
  });

  it('copies stripe session id to clipboard', async () => {
    const user = userEvent.setup();
    const mockRegistrations = [
      createMockRegistrationWithUser(
        { stripe_session_id: 'cs_test_123456789' },
        { full_name: 'John Doe' }
      ),
    ];

    mockUseEventRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    const copyButton = screen.getByLabelText('Copy session ID');
    await user.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('cs_test_123456789');
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Copied session ID',
      description: 'Stripe session ID copied to clipboard.',
    });
  });

  it('opens stripe dashboard link', () => {
    const mockRegistrations = [
      createMockRegistrationWithUser(
        { stripe_session_id: 'cs_test_123456789' },
        { full_name: 'John Doe' }
      ),
    ];

    mockUseEventRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    const stripeLink = screen.getByLabelText('Open in Stripe Dashboard');
    expect(stripeLink.closest('a')).toHaveAttribute('href', 'https://stripe.com/search?q=cs_test_123456789');
    expect(stripeLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('shows tooltip with full session ID', async () => {
    const user = userEvent.setup();
    const mockRegistrations = [
      createMockRegistrationWithUser(
        { stripe_session_id: 'cs_test_123456789abcdef' },
        { full_name: 'John Doe' }
      ),
    ];

    mockUseEventRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    const sessionText = screen.getByText('cs_test_...cdef');
    await user.hover(sessionText);

    await waitFor(() => {
      expect(screen.getByText('cs_test_123456789abcdef')).toBeInTheDocument();
    });
  });

  it('handles delete registration', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    mockUseDeleteRegistration.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    const mockRegistrations = [
      createMockRegistrationWithUser(
        { id: 'reg-1' },
        { full_name: 'John Doe' }
      ),
    ];

    mockUseEventRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    const deleteButton = screen.getByLabelText('Delete registration');
    await user.click(deleteButton);

    // Confirm deletion in alert dialog
    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    expect(mockMutate).toHaveBeenCalledWith('reg-1');
  });

  it('shows empty state when no registrations', () => {
    mockUseEventRegistrations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('No registrations yet')).toBeInTheDocument();
  });

  it('handles clipboard copy failure gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Clipboard failed'));

    const mockRegistrations = [
      createMockRegistrationWithUser(
        { stripe_session_id: 'cs_test_123456789' },
        { full_name: 'John Doe' }
      ),
    ];

    mockUseEventRegistrations.mockReturnValue({
      data: mockRegistrations,
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={vi.fn()}
        eventId="event-123"
        eventTitle="Test Event"
      />,
      { wrapper: createWrapper() }
    );

    const copyButton = screen.getByLabelText('Copy session ID');
    await user.click(copyButton);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Copy failed',
      description: 'Could not copy to clipboard.',
      variant: 'destructive',
    });
  });
});