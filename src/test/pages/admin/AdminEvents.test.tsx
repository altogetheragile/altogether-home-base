import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import AdminEvents from '@/pages/admin/AdminEvents';

vi.mock('@/hooks/useEvents', () => ({
  useEvents: vi.fn(),
}));

vi.mock('@/hooks/useEventMutations', () => ({
  useEventMutations: vi.fn(),
}));

vi.mock('@/components/admin/events/EventRegistrationsDialog', () => ({
  default: ({ open, onOpenChange, eventTitle }: any) => 
    open ? <div data-testid="registrations-dialog">Registrations for {eventTitle}</div> : null,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AdminEvents', () => {
  const mockUseEvents = vi.mocked(require('@/hooks/useEvents').useEvents);
  const mockUseEventMutations = vi.mocked(require('@/hooks/useEventMutations').useEventMutations);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEventMutations.mockReturnValue({
      deleteEvent: { mutate: vi.fn(), isPending: false },
    });
  });

  it('renders loading state', () => {
    mockUseEvents.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays events with registration counts', () => {
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Test Event 1',
        event_date: '2023-12-01',
        start_time: '14:00',
        instructor: { name: 'John Instructor' },
        location: { name: 'Test Location' },
        price: 50,
        currency: 'USD',
        status: 'published',
        registrations: [
          { id: 'reg-1', payment_status: 'paid' },
          { id: 'reg-2', payment_status: 'pending' },
        ],
      },
      {
        id: 'event-2',
        title: 'Test Event 2',
        event_date: '2023-12-02',
        start_time: '10:00',
        instructor: { name: 'Jane Instructor' },
        location: { name: 'Another Location' },
        price: 75,
        currency: 'USD',
        status: 'draft',
        registrations: [
          { id: 'reg-3', payment_status: 'paid' },
        ],
      },
    ];

    mockUseEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    // Check event titles are displayed
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();

    // Check instructors
    expect(screen.getByText('John Instructor')).toBeInTheDocument();
    expect(screen.getByText('Jane Instructor')).toBeInTheDocument();

    // Check locations
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('Another Location')).toBeInTheDocument();

    // Check registration counts
    expect(screen.getByText('2 registrations')).toBeInTheDocument();
    expect(screen.getByText('1 registrations')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('opens registration dialog when clicking registration count', async () => {
    const user = userEvent.setup();
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Test Event',
        event_date: '2023-12-01',
        start_time: '14:00',
        instructor: { name: 'John Instructor' },
        location: { name: 'Test Location' },
        price: 50,
        currency: 'USD',
        status: 'published',
        registrations: [
          { id: 'reg-1', payment_status: 'paid' },
        ],
      },
    ];

    mockUseEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    const registrationButton = screen.getByText('1 registrations');
    await user.click(registrationButton);

    await waitFor(() => {
      expect(screen.getByTestId('registrations-dialog')).toBeInTheDocument();
      expect(screen.getByText('Registrations for Test Event')).toBeInTheDocument();
    });
  });

  it('shows empty state when no events', () => {
    mockUseEvents.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    expect(screen.getByText('No events found')).toBeInTheDocument();
  });

  it('handles zero registrations correctly', () => {
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Test Event',
        event_date: '2023-12-01',
        start_time: '14:00',
        instructor: { name: 'John Instructor' },
        location: { name: 'Test Location' },
        price: 50,
        currency: 'USD',
        status: 'published',
        registrations: [],
      },
    ];

    mockUseEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    expect(screen.getByText('0 registrations')).toBeInTheDocument();
  });

  it('displays event prices correctly', () => {
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Free Event',
        event_date: '2023-12-01',
        start_time: '14:00',
        instructor: { name: 'John Instructor' },
        location: { name: 'Test Location' },
        price: 0,
        currency: 'USD',
        status: 'published',
        registrations: [],
      },
      {
        id: 'event-2',
        title: 'Paid Event',
        event_date: '2023-12-02',
        start_time: '14:00',
        instructor: { name: 'Jane Instructor' },
        location: { name: 'Test Location' },
        price: 99,
        currency: 'EUR',
        status: 'published',
        registrations: [],
      },
    ];

    mockUseEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('€99')).toBeInTheDocument();
  });

  it('handles events with missing data gracefully', () => {
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Incomplete Event',
        event_date: '2023-12-01',
        start_time: '14:00',
        instructor: null,
        location: null,
        price: 50,
        currency: 'USD',
        status: 'published',
        registrations: [],
      },
    ];

    mockUseEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    expect(screen.getByText('Incomplete Event')).toBeInTheDocument();
    expect(screen.getByText('No instructor')).toBeInTheDocument();
    expect(screen.getByText('No location')).toBeInTheDocument();
  });

  it('deletes event when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();
    mockUseEventMutations.mockReturnValue({
      deleteEvent: { mutate: mockMutate, isPending: false },
    });

    const mockEvents = [
      {
        id: 'event-1',
        title: 'Test Event',
        event_date: '2023-12-01',
        start_time: '14:00',
        instructor: { name: 'John Instructor' },
        location: { name: 'Test Location' },
        price: 50,
        currency: 'USD',
        status: 'published',
        registrations: [],
      },
    ];

    mockUseEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
      isError: false,
    });

    render(<AdminEvents />, { wrapper: createWrapper() });

    const deleteButton = screen.getByLabelText('Delete event');
    await user.click(deleteButton);

    // Confirm deletion in alert dialog
    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    expect(mockMutate).toHaveBeenCalledWith('event-1');
  });
});