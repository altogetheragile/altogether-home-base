import { describe, it, expect } from 'vitest';
import { getFriendlyAuthError } from './authErrors';

// Two different limits wore the same message.
//
// Sign-in throttling clears in minutes. The limit on SENDING EMAIL does not - Supabase's built-in
// mail service allows a handful an hour - and telling somebody to wait a few minutes sends them
// back to press the button again and be refused again, with no idea why. Reported exactly that
// way: "even after a few mins I get this message".

const of = (message: string) => getFriendlyAuthError({ message });

describe('a rate limit', () => {
  it('says hourly when it is the email one', () => {
    for (const raw of ['Email rate limit exceeded', 'For security purposes, email rate limit reached']) {
      const friendly = of(raw);
      expect(friendly.description, raw).toMatch(/hourly/i);
      // Not "wait a few minutes" - the message may well say the limit is NOT a few minutes.
      expect(friendly.description, `"${raw}" still promises minutes`).not.toMatch(/wait a few minutes/i);
    }
  });

  it('still says minutes for attempt throttling, which does clear that fast', () => {
    for (const raw of ['Too many requests', 'Request rate limit reached']) {
      expect(of(raw).description, raw).toMatch(/few minutes/i);
    }
  });

  it('tells you the newest link is the one to use, since older ones are dead', () => {
    expect(of('Email rate limit exceeded').description).toMatch(/most recent/i);
  });
});
