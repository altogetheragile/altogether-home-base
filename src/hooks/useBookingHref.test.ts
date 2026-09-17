import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { bookingHref, BOOKING_PATH, BOOKING_FALLBACK } from '@/config/featureFlags';
import { useBookingHref } from './useBookingHref';

// The hook's only job is to feed the site setting into bookingHref, so the
// settings query is mocked rather than stood up against a fake Supabase.
const useSiteSettings = vi.fn();
vi.mock('@/hooks/useSiteSettings', () => ({
  useSiteSettings: () => useSiteSettings(),
}));

describe('bookingHref', () => {
  it('sends people to the booking page when bookings are on', () => {
    expect(bookingHref(true)).toBe(BOOKING_PATH);
  });

  // Off, unset and never-loaded all have to land on the contact page: the
  // booking route renders "Page Not Found" in every one of those states.
  it.each([
    ['off', false],
    ['null', null],
    ['undefined', undefined],
  ])('falls back to contact when the setting is %s', (_label, value) => {
    expect(bookingHref(value as boolean | null | undefined)).toBe(BOOKING_FALLBACK);
  });
});

describe('useBookingHref', () => {
  beforeEach(() => {
    useSiteSettings.mockReset();
  });

  it('follows the show_bookings setting', () => {
    useSiteSettings.mockReturnValue({ settings: { show_bookings: true } });
    expect(renderHook(() => useBookingHref()).result.current).toBe(BOOKING_PATH);

    useSiteSettings.mockReturnValue({ settings: { show_bookings: false } });
    expect(renderHook(() => useBookingHref()).result.current).toBe(BOOKING_FALLBACK);
  });

  it('falls back while the settings query is still in flight', () => {
    useSiteSettings.mockReturnValue({ settings: undefined, isLoading: true });
    expect(renderHook(() => useBookingHref()).result.current).toBe(BOOKING_FALLBACK);
  });
});
