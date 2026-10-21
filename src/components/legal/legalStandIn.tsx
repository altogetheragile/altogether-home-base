import type { ReactNode } from 'react';
import { OwnLegal } from './OwnLegal';
import { UnpublishedLegal, usePublishesLegal } from './UnpublishedLegal';
import { useOwnLegal, type LegalPage } from './legalText';

/** What a legal page shows in place of the document written into it, or null to show that.
 *
 *  A site's own words first, written on This Site; then, for the site whose documents these are,
 *  the documents; and for anybody else, a page saying it has not been written. */
export function useLegalStandIn(page: LegalPage, title: string): ReactNode | null {
  const publishes = usePublishesLegal();
  const { data, isLoading } = useOwnLegal();
  const own = data?.[page];
  if (own) return <OwnLegal page={page} title={title} text={own} />;
  // Blank rather than a guess while the words load, so neither the shipped document nor "not
  // published" flashes up in front of a page that has its own.
  if (isLoading) return <div style={{ minHeight: '100vh', background: '#FFFFFF' }} />;
  if (!publishes) return <UnpublishedLegal title={title} />;
  return null;
}
