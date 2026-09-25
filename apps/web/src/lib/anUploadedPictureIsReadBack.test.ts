import { describe, it, expect } from 'vitest';
import { resolveImages, logoOf, picture } from '@altogether/ui/brand';

// The editor's picture box stores a picture and its alt text together, as {"src":…,"alt":…}.
// Every reader of a brand image tested that value against a URL pattern instead, so an uploaded
// logo, favicon, share image or founder photograph was written, read back, judged invalid and
// silently replaced by the shipped default. Nothing failed. The upload appeared to work, the box
// showed the picture afterwards, and the site kept showing somebody else's.

const uploaded = (src: string, alt = '') => JSON.stringify({ src, alt });
const PHOTO = 'https://project.supabase.co/storage/v1/object/public/assets/site/1790373361810.jpeg';

describe('an uploaded picture is read back', () => {
  it('reads the shape the picture box actually writes', () => {
    const images = resolveImages({ images: { founderPhoto: uploaded(PHOTO, 'Fiona') } });
    expect(images.founderPhoto).toBe(PHOTO);
  });

  it('still reads a bare URL, which is what everything seeded before the box is', () => {
    expect(resolveImages({ images: { founderPhoto: '/images/alun.webp' } }).founderPhoto).toBe('/images/alun.webp');
    expect(resolveImages({ images: { logo: 'https://example.com/logo.svg' } }).logo).toBe('https://example.com/logo.svg');
  });

  it('reads an uploaded logo, which decides whether a header shows a picture or a name', () => {
    expect(logoOf({ images: { logo: uploaded('https://cdn.example/logo.svg') } })).toEqual({
      mode: 'image', src: 'https://cdn.example/logo.svg',
    });
  });

  it('holds the share image to an absolute URL in either shape', () => {
    // A crawler has only the URL, so a path would send it somewhere that does not exist.
    expect(resolveImages({ images: { ogImage: uploaded('/images/share.png') } }).ogImage).not.toBe('/images/share.png');
    expect(resolveImages({ images: { ogImage: uploaded('https://cdn.example/share.png') } }).ogImage)
      .toBe('https://cdn.example/share.png');
  });

  it('drops a value that is neither, rather than rendering it', () => {
    for (const bad of ['', '   ', 'not a url', '{"alt":"no src"}', '{broken', 'javascript:alert(1)']) {
      expect(resolveImages({ images: { founderPhoto: bad } }).founderPhoto, bad).toBe('');
    }
  });

  it('keeps the alt text available, even though resolveImages answers with the src', () => {
    // The words are stored with the picture on purpose. Losing them here would be the same bug
    // one layer down: written, kept, and never read.
    expect(picture(uploaded(PHOTO, 'Fiona in her studio'))?.alt).toBe('Fiona in her studio');
  });
});
