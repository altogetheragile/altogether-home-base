import { getCopy } from './index';

/** The small words that appear on more than one page, from the This Site tab.
 *
 *  Resolved on the server and handed down, because the components that show them are client
 *  components and getCopy needs a server client. */
export async function siteWords() {
  const t = await getCopy('site');
  return {
    readMore: t('site.words.readMore'),
    readLess: t('site.words.readLess'),
    viaLinkedIn: t('site.words.viaLinkedIn'),
    of: t('site.words.of'),
    minRead: t('site.words.minRead'),
    postNotFound: t('site.words.postNotFound'),
  };
}
