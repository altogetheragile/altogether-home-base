import { createClient } from '@/lib/supabase/client';

// Asks the reading-book-lookup edge function what an Amazon link says about a book. The function
// never reads Amazon: it takes the ASIN and title words from the link and asks Open Library.

export interface LookupResult {
  asin: string | null;
  title: string | null;
  author: string | null;
  cover_url: string | null;
  matchedBy: 'isbn' | 'title' | null;
  note: string;
}

export async function lookUpAmazonLink(url: string): Promise<LookupResult> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('reading-book-lookup', { body: { url } });
  if (error) {
    // The function's own message, when it sent one, says more than "non-2xx status code".
    const said = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(said?.error ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data as LookupResult;
}
