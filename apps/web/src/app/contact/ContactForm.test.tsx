import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactForm } from './ContactForm';

// Mock the Supabase browser client so nothing hits the network. vi.hoisted exposes the
// insert/invoke spies to the hoisted vi.mock factory and to the assertions below.
const { insertMock, invokeMock } = vi.hoisted(() => ({ insertMock: vi.fn(), invokeMock: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ insert: insertMock }),
    functions: { invoke: invokeMock },
  }),
}));

function fillValid() {
  fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Jane Smith' } });
  fireEvent.change(screen.getByPlaceholderText('your.email@example.com'), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('What is this about?'), { target: { value: 'Team coaching enquiry' } });
  fireEvent.change(screen.getByPlaceholderText('Tell us more about your enquiry...'), {
    target: { value: 'We would like to discuss agile team coaching for our group.' },
  });
}

let now = 0;

describe('ContactForm', () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    invokeMock.mockReset().mockResolvedValue({ error: null });
    now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    // The form looks up the caller's IP via ipify before inserting.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ ip: '1.2.3.4' }) }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the form with its key fields', () => {
    render(<ContactForm />);
    expect(screen.getByRole('heading', { name: /send us a message/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('blocks submission and shows validation errors when fields are invalid', async () => {
    render(<ContactForm />);
    now = 5000; // advance past the 3s anti-spam guard so we actually reach validation
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('submits a valid enquiry to contacts with the expected shape and shows success', async () => {
    render(<ContactForm />);
    fillValid();
    now = 5000; // past the anti-spam guard
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
    expect(insertMock).toHaveBeenCalledTimes(1);
    // The exact shape that a DB CHECK constraint once rejected — lock it down.
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        enquiry_type: 'general',
        status: 'unread',
      }),
    );
  });

  it('treats a filled honeypot as spam: shows success but never inserts', async () => {
    render(<ContactForm />);
    fillValid();
    fireEvent.change(screen.getByLabelText('Website'), { target: { value: 'http://spam.example' } });
    now = 5000;
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });
});
