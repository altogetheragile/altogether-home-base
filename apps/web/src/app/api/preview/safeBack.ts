/** Where the preview switch agrees to send somebody afterwards: somewhere on this site, and
 *  nowhere else.
 *
 *  Its own module because a Next route file may only export the fields Next knows about, and the
 *  build refuses anything else. Worth having apart anyway: an open redirect is the kind of thing
 *  that wants a test of its own, and this address is public.
 *
 *  `//evil.example` is a protocol-relative URL that a browser reads as another origin, so a
 *  leading slash on its own is not enough. */
export function safeBack(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}
