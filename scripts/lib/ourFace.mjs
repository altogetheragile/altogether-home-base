// ============= What does not ship to somebody else's site =============
//
// public/ is copied wholesale into every build, so this repository's own face is deployed to
// every site made from it: the kanji favicon, the lockups and wordmarks, and photographs of one
// particular person. Nothing on a second site links to them any more - that was fixed a file at
// a time - but they are still sitting there on her domain, reachable by anyone who guesses the
// path, and picked up by anything that goes looking for a favicon without being told.
//
// Asked for after "/favicon.svg still serves your kanji on her domain": the kanji, being the
// thing a browser fetches on its own, was the one causing trouble. The rest is the same argument.
//
// Deliberately NOT here:
//
//   og-image.png      An illustration rather than a mark. A link shared with no picture looks
//                     worse than one shared with a generic picture, and it says nothing about
//                     whose site it is. It is the one default a second site still inherits.
//   images/hero-bg-*  A pattern, and one a second site may legitimately choose: the picture box
//                     takes a pasted path, and this site's own hero is built from these three.
//
// A path here is removed from a build that is not this repository's own site. On our own build
// nothing is touched - these are the files this site is made of.

/** Files and folders under public/ that are this repository's identity and nobody else's. */
export const OUR_FACE = [
  // The kanji. What a browser asks for when a page names no icon.
  'favicon.svg',
  // Every lockup, wordmark and mark, including three more favicons.
  'brand',
  // One particular person, in photograph and in illustration.
  'images/alun.jpg',
  'images/alun.webp',
  'images/alun-illustrated.png',
  'images/alun-illustrated.webp',
  // Named after this company, in the file name and in the picture.
  'images/altogether-agile-landscape-fixed.svg',
];

/** Removes this repository's face from a build that belongs to somebody else.
 *
 *  @param {string} dist   the build directory
 *  @param {boolean} ours  whether this build is this repository's own site
 *  @param {{ join: Function, existsSync: Function, rmSync: Function }} fs
 *  @returns {string[]} what was removed, for the build log
 */
export function removeOurFace(dist, ours, { join, existsSync, rmSync }) {
  if (ours) return [];
  const gone = [];
  for (const path of OUR_FACE) {
    const full = join(dist, path);
    if (!existsSync(full)) continue;
    rmSync(full, { recursive: true, force: true });
    gone.push(path);
  }
  return gone;
}
