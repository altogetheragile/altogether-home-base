import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import EventRegistrationsDialog from '@/components/admin/events/EventRegistrationsDialog';
import { createMockRegistrationWithUser, mockClipboard } from '@/test/utils/testHelpers';

// Mock the hooks module first (hoisted)
const mockUseEventRegistrations = vi.fn();
const mockUseDeleteRegistration = vi.fn();

vi.mock('@/hooks/useEventRegistrations', () => ({
  useEventRegistrations: mockUseEventRegistrations,
  useDeleteRegistration: mockUseDeleteRegistration,
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
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard();
    
    vi.mocked(require('@/hooks/use-toast').useToast).mockReturnValue({ toast: mockToast });
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
        onOpenChange={() => {}}
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
        onOpenChange={() => {}}
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
        onOpenChange={() => {}}
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
        onOpenChange={() => {}}
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
        onOpenChange={() => {}}
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
        onOpenChange={() => {}}
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

  it('shows empty state when no registrations', () => {
    mockUseEventRegistrations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(
      <EventRegistrationsDialog
        open={true}
        onOpenChange={() => {}}
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
        onOpenChange={() => {}}
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