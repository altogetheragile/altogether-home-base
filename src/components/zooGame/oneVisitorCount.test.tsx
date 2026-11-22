import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ParkView } from './ParkView';
import { initialZooState } from './config';
import type { ZooGameState } from './types';

// One number for one Sprint's visitors. At the Review the park said "337 visitors" while a
// stakeholder beside it said "480 people came this Sprint" (scrum-master playtest): the park added
// up `attendance`, which the Review has already moved on to what next Sprint expects.

const atReview = (phase: ZooGameState['phase']): ZooGameState => ({
  ...initialZooState(1), phase, zones: ['Big Cats'],
  // Something open, so there is a park to stand the count on.
  backlog: [{ id: 'enc', name: 'Lion Enclosure', zone: 'Big Cats', category: 'enclosure', status: 'open',
    points: 3, acceptance: [], acConfirmed: [], tasks: [], enclosureSize: 'medium' }],
  attendance: { families: 200, enthusiasts: 100, comfortSeekers: 37 },
  lastReview: { totalAttendance: 480, overallHappiness: 50 },
} as unknown as ZooGameState);

/** The badge is drawn inside the park's lazy-loaded drawing, so it is waited for. */
const badge = async (s: ZooGameState) => {
  render(<MemoryRouter><ParkView state={s} large focus increment /></MemoryRouter>);
  return (await screen.findByText(/open to visitors/, {}, { timeout: 5000 })).textContent ?? '';
};

describe('the visitors on the park', () => {
  it('at the Review, are the Sprint the stakeholders are talking about', async () => {
    expect(await badge(atReview('review'))).toMatch(/480 visitors this Sprint/);
  });

  it('during a Sprint, are who is visiting now', async () => {
    const said = await badge(atReview('sprint'));
    expect(said).toMatch(/337 visitors/);
    expect(said).not.toMatch(/this Sprint/);
  });
});
