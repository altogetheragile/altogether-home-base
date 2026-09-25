import { describe, it, expect } from 'vitest';
import { splitWordmark, wordmarkOf } from '@altogether/ui/brand';

/** A site with no logo file sets its own name where the logo goes. Plainly by default, and in two
 *  colours if it asks, which is the whole of this site's own lettering expressed as a rule rather
 *  than shipped as a picture somebody else would have to redraw. */
describe('the wordmark belongs to the site', () => {
  describe('where a name comes apart', () => {
    it('splits on the last space, and remembers the space', () => {
      expect(splitWordmark('Altogether Agile')).toEqual({ first: 'Altogether', second: 'Agile', gap: true });
      // The last space, so a longer name accents only its final word.
      expect(splitWordmark('Bramble & Fern')).toEqual({ first: 'Bramble &', second: 'Fern', gap: true });
    });

    it('splits a single word on the capital that starts its second half', () => {
      // Written as one word, read as two. Without this it renders as one flat block of colour.
      expect(splitWordmark('StreamStrategy')).toEqual({ first: 'Stream', second: 'Strategy', gap: false });
    });

    it('never splits on the capital a name starts with', () => {
      expect(splitWordmark('Acme')).toEqual({ first: 'Acme', second: '', gap: false });
      expect(splitWordmark('IBM')).toEqual({ first: 'IBM', second: '', gap: false });
    });

    it('is not fooled by stray whitespace', () => {
      expect(splitWordmark('  Stream   Strategy  ')).toEqual({ first: 'Stream', second: 'Strategy', gap: true });
    });
  });

  describe('whether it is set in two colours', () => {
    const on = { wordmark: { twoTone: 'on' } };

    it('is off unless the site asks for it', () => {
      // It is this site's typographic signature. A second site should look like itself first.
      expect(wordmarkOf(null, 'Stream Strategy').twoTone).toBe(false);
      expect(wordmarkOf({}, 'Stream Strategy').twoTone).toBe(false);
      expect(wordmarkOf(on, 'Stream Strategy').twoTone).toBe(true);
    });

    /** The brand column holds strings, which is what the editor's switch writes and what
     *  readField gives back. A boolean here reads as empty and silently stays off. */
    it('reads the string the editor actually writes, not a boolean', () => {
      expect(wordmarkOf({ wordmark: { twoTone: true } }, 'Stream Strategy').twoTone).toBe(false);
      expect(wordmarkOf({ wordmark: { twoTone: 'on' } }, 'Stream Strategy').twoTone).toBe(true);
    });

    it('stays in one colour when there is no second part to colour', () => {
      // Asking for two-tone and getting one word is not an error, it is just one colour.
      expect(wordmarkOf(on, 'Acme')).toEqual({ first: 'Acme', second: '', gap: false, twoTone: false });
    });

    it('survives a site with no name at all', () => {
      expect(wordmarkOf(on, null)).toEqual({ first: '', second: '', gap: false, twoTone: false });
    });
  });
});
