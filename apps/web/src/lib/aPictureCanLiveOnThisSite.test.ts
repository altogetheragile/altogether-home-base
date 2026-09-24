import { describe, it, expect } from 'vitest';
import { resolveImages, logoOf, defaultImages } from '@altogether/ui/brand';

// A brand image override has to actually be used. This is the bug that hid best in the whole
// session: the rule was "absolute http address only", the shipped defaults were this site's own
// files, so a rejected override fell back to the very picture it was trying to set. Nothing looked
// wrong for months. The moment the defaults went empty - so a second site would not wear this
// one's face - the founder photograph vanished from the live site, and the row written to keep it
// turned out never to have been read.
//
// So these assert the override is USED, not merely accepted.

describe('a picture can live on this site', () => {
  it('uses a path to a file this site serves', () => {
    const images = resolveImages({ images: { founderPhoto: '/images/alun.webp' } });
    expect(images.founderPhoto, 'a path was discarded and fell back to the default').toBe('/images/alun.webp');
  });

  it('uses an uploaded address', () => {
    const url = 'https://xyz.supabase.co/storage/v1/object/public/assets/site/a.png';
    expect(resolveImages({ images: { founderPhoto: url } }).founderPhoto).toBe(url);
  });

  it('still insists the social sharing image is absolute', () => {
    // A crawler has only the URL, so a path sends it somewhere that does not exist.
    expect(resolveImages({ images: { ogImage: '/images/og.png' } }).ogImage).toBe(defaultImages.ogImage);
    const url = 'https://example.test/og.png';
    expect(resolveImages({ images: { ogImage: url } }).ogImage).toBe(url);
  });

  it('refuses things that are not addresses at all', () => {
    for (const bad of ['', '   ', 'images/alun.webp', 'javascript:alert(1)', 'not a url', '//evil.test/x.png']) {
      expect(resolveImages({ images: { founderPhoto: bad } }).founderPhoto,
        `${JSON.stringify(bad)} was accepted`).toBe(defaultImages.founderPhoto);
    }
  });

  it('lets the logo be a file this site serves', () => {
    expect(logoOf({ images: { logo: '/brand/lockup.svg' } }, 'Someone')).toEqual({ mode: 'image', src: '/brand/lockup.svg' });
  });

  it('falls back to a wordmark rather than somebody else\'s logo', () => {
    expect(logoOf({ images: { logo: 'nonsense' } }, 'Her Company')).toEqual({ mode: 'wordmark', text: 'Her Company' });
  });

  it('ships no picture of a person', () => {
    // The other half of the same lesson: the defaults must stay empty, or this comes back.
    expect(defaultImages.founderPhoto).toBe('');
    expect(defaultImages.founderPortrait).toBe('');
  });
});
