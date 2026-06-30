import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoachingEnquiryForm } from './CoachingEnquiryForm';

const { insertMock, invokeMock } = vi.hoisted(() => ({ insertMock: vi.fn(), invokeMock: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ insert: insertMock }),
    functions: { invoke: invokeMock },
  }),
}));

describe('CoachingEnquiryForm', () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    invokeMock.mockReset().mockResolvedValue({ error: null });
  });

  it('renders the enquiry fields', () => {
    render(<CoachingEnquiryForm />);
    expect(screen.getByPlaceholderText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('jane@company.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send enquiry/i })).toBeInTheDocument();
  });

  it('blocks submission and shows a validation error when invalid', async () => {
    render(<CoachingEnquiryForm />);
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('submits a valid coaching enquiry to contacts with the expected shape and shows success', async () => {
    render(<CoachingEnquiryForm />);
    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), { target: { value: 'Jane Smith' } });
    fireEvent.change(screen.getByPlaceholderText('jane@company.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/tell me a bit about/i), {
      target: { value: 'I would like one-to-one coaching as I move into a new lead role.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send enquiry/i }));

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        enquiry_type: 'general',
        status: 'unread',
      }),
    );
  });
});
