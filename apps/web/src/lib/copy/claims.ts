// What a claim looks like when it is written down, for the checks that must not let one through.
//
// A figure with a plus, a star rating, years of experience, authorship of a framework. None of
// these are wrong to say about yourself. All of them are wrong to have said for you: by a default
// that ships to every site, or by starter wording a site has not read yet.

/** Wording that asserts something checkable. Matching it is reason enough to leave a value out. */
export const UNEARNED = /\d[\d,]*\s*\+|★|\bco-author\b|\b\d+\s*years?\b|contributed to the frameworks/i;
