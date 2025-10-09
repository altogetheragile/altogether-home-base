import { vi } from 'vitest';
import type { AdminRegistrationWithUser, AdminRegistration, AdminRegistrationUser } from '@/hooks/useEventRegistrations';
import type { UserRegistrationWithEvent, BasicRegistration, EventDetails } from '@/hooks/useUserRegistrations';

// Mock Supabase response structure
export const createMockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
});

// Mock auth user
export const mockAuthUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone: '',
  confirmation_sent_at: '2023-01-01T00:00:00Z',
  confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

// Mock registration data
export const createMockRegistration = (overrides: Partial<AdminRegistration> = {}): AdminRegistration => ({
  id: 'reg-123',
  event_id: 'event-123',
  user_id: 'user-123',
  registered_at: '2023-01-01T10:00:00Z',
  payment_status: 'paid',
  stripe_session_id: 'cs_test_123456789',
  ...overrides,
});

export const createMockUser = (overrides: Partial<AdminRegistrationUser> = {}): AdminRegistrationUser => ({
  id: 'user-123',
  full_name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe',
  role: 'user',
  ...overrides,
});

export const createMockRegistrationWithUser = (
  registrationOverrides: Partial<AdminRegistration> = {},
  userOverrides: Partial<AdminRegistrationUser> = {}
): AdminRegistrationWithUser => ({
  ...createMockRegistration(registrationOverrides),
  user: createMockUser(userOverrides),
});

// Mock event data for user registrations  
export const createMockEventDetails = (overrides: Partial<EventDetails> = {}): EventDetails => ({
  id: 'event-123',
  title: 'Test Event',
  start_date: '2023-12-01T14:00:00Z',
  end_date: '2023-12-01T16:00:00Z',
  price_cents: 5000,
  currency: 'USD',
  instructor_id: 'instructor-123',
  ...overrides,
});

export const createMockBasicRegistration = (overrides: Partial<BasicRegistration> = {}): BasicRegistration => ({
  id: 'reg-123',
  event_id: 'event-123',
  registered_at: '2023-01-01T10:00:00Z',
  payment_status: 'paid',
  stripe_session_id: 'cs_test_123456789',
  ...overrides,
});

export const createMockUserRegistrationWithEvent = (
  registrationOverrides: Partial<BasicRegistration> = {},
  eventOverrides: Partial<EventDetails> = {}
): UserRegistrationWithEvent => ({
  ...createMockBasicRegistration(registrationOverrides),
  event: createMockEventDetails(eventOverrides),
});

// Mock clipboard API
export const mockClipboard = () => {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
};

// Mock supabase client
export const createMockSupabaseClient = () => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
});