import { describe, it, expect } from 'vitest';
// @ts-expect-error - a plain .mjs script, imported for its matcher
import { isMatch, norm } from '../../../scripts/fetch-reading-covers.mjs';

// A wrong cover is worse than none: nobody notices it, and the page then shows the wrong book next
// to the right title. So the matcher is strict, and these say how strict.

const book = (title: string, author: string) => ({ title, author });
const doc = (title: string, ...author_name: string[]) => ({ title, author_name });

describe('matching a book to an Open Library record', () => {
  it('matches the same title by the same author, whatever the case and punctuation', () => {
    expect(isMatch(book('Coaching Agile Teams', 'Lyssa Adkins'), doc('Coaching agile teams', 'Lyssa Adkins'))).toBe(true);
    expect(isMatch(book('Scrum: A Pocket Guide', 'Gunther Verheyen'), doc('Scrum - A Pocket Guide', 'Gunther Verheyen'))).toBe(true);
  });

  it('matches on any one of several authors', () => {
    expect(isMatch(
      book('Mastering Professional Scrum', 'Stephanie Ockerman, Simon Reindl'),
      doc('Mastering Professional Scrum', 'Simon Reindl'),
    )).toBe(true);
  });

  it('accepts a subtitle Open Library has and we do not', () => {
    expect(isMatch(book('Team Topologies', 'Matthew Skelton'), doc('Team Topologies: Organizing Business and Technology Teams', 'Matthew Skelton', 'Manuel Pais'))).toBe(true);
  });

  it('refuses a different book that starts with the same words', () => {
    expect(isMatch(book('Scrum Mastery', 'Geoff Watts'), doc('Scrum Mastery Quote Cards', 'Geoff Watts'))).toBe(false);
    expect(isMatch(book('Kanban', 'David J. Anderson'), doc('Kanban Change Leadership', 'Klaus Leopold'))).toBe(false);
  });

  it('refuses the right title by somebody else', () => {
    expect(isMatch(book('Drive', 'Daniel H. Pink'), doc('Drive', 'James Sallis'))).toBe(false);
  });

  it('ignores a note in brackets after an author', () => {
    expect(isMatch(book('97 Things Every Scrum Practitioner Should Know', 'Gunther Verheyen (editor)'), doc('97 Things Every Scrum Practitioner Should Know', 'Gunther Verheyen'))).toBe(true);
  });

  it('folds accents, so an author with one still matches', () => {
    expect(norm('Joakim Sundén')).toBe('joakim sunden');
  });
});
