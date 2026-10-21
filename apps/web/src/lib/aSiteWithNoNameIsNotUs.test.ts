import { describe, it, expect, afterEach } from 'vitest';
import { logoOf } from '@altogether/ui/brand';
import { logoName } from './ourSite';

// A site with no logo and no name yet fell back to this repository's lockup, so its header,
// footer and holding page wore Altogether Agile's mark. Its own address is the name it has.

const was = process.env.NEXT_PUBLIC_SITE_URL;
afterEach(() => {
  if (was === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = was;
});

describe('a site with no name is not us', () => {
  it('calls itself by its own address', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.streamstrategy.co.uk';
    expect(logoName(null)).toBe('streamstrategy.co.uk');
    expect(logoOf({}, logoName('  '))).toEqual({ mode: 'wordmark', text: 'streamstrategy.co.uk' });
  });

  it('keeps a name it has been given', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.streamstrategy.co.uk';
    expect(logoName('Stream Strategy')).toBe('Stream Strategy');
  });

  it('leaves our own site on its own lockup', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://altogetheragile.com';
    expect(logoName(null)).toBeNull();
    expect(logoOf({}, logoName(null)).mode).toBe('image');
  });
});
