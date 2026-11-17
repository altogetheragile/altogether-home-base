// What the topic buttons and the search box do, without the component, so it can be tested.

export interface ListedBook {
  id: string;
  title: string;
  author: string;
  blurb: string | null;
  featured: boolean;
  href: string;
  /** Optional: a book with no cover is a text-only tile. */
  cover?: string | null;
}

export interface ListedShelf {
  category: { id: string; name: string; slug: string; description: string | null };
  books: ListedBook[];
}

/** Lower case, accents off, runs of space squeezed: "Ståhl" is found by "stahl". */
export const fold = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036F]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** The shelves to show for a topic and a search. An empty topic is every topic. Every word typed
 *  has to appear in the title or the author, in any order, so "watts scrum" finds Scrum Mastery. */
export function filterShelves(shelves: ListedShelf[], { category, query }: { category: string; query: string }): ListedShelf[] {
  const words = fold(query).split(' ').filter(Boolean);
  return shelves
    .filter((s) => !category || s.category.slug === category)
    .map((s) => ({
      ...s,
      books: words.length
        ? s.books.filter((b) => {
          const hay = fold(`${b.title} ${b.author}`);
          return words.every((w) => hay.includes(w));
        })
        : s.books,
    }))
    .filter((s) => s.books.length > 0);
}
