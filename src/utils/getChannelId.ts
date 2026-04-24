// YouTube channel ids are 24 chars total: the "UC" prefix plus 22 chars
// from the base64-url alphabet. Two patterns: one to pull the id out of a
// URL, one to validate a string we already have.
const CHANNEL_ID_PATTERN = /\/channel\/(UC[0-9A-Za-z_-]{22})/;
const CHANNEL_ID_EXACT = /^UC[0-9A-Za-z_-]{22}$/;

/**
 * Partial shape of `window.ytInitialData`. YouTube attaches a much larger
 * object; we only model the two paths we actually read so the rest stays
 * opaque.
 */
interface YtInitialData {
  metadata?: { channelMetadataRenderer?: { externalId?: string } };
  header?: { c4TabbedHeaderRenderer?: { channelId?: string } };
}

declare global {
  interface Window {
    /** Attached by YouTube during page render. Not always present. */
    ytInitialData?: YtInitialData;
  }
}

/**
 * Extract the current page's channel id (e.g. `"UCxxxxxxxxxxxxxxxxxxxxxx"`).
 *
 * Tries three sources in order of reliability:
 *   1. `<meta property="og:url">` — set synchronously on channel pages.
 *   2. `<link rel="canonical">` — fallback for partial rollouts / experiments.
 *   3. `window.ytInitialData` — inspected last because it's less stable and
 *      only populated after the SPA hydrates.
 *
 * Returns `undefined` when no channel id is found (e.g. we're on a video
 * or search page that slipped past {@link isOnChannelPage}).
 */
export const getChannelId = (): string | undefined => {
  const og = document.head.querySelector<HTMLMetaElement>(
    "meta[property~='og:url'][content]",
  );
  if (og) {
    const match = og.content.match(CHANNEL_ID_PATTERN);
    if (match) return match[1];
  }

  const canonical = document.head.querySelector<HTMLLinkElement>(
    "link[rel='canonical'][href]",
  );
  if (canonical) {
    const match = canonical.href.match(CHANNEL_ID_PATTERN);
    if (match) return match[1];
  }

  const initial = window.ytInitialData;
  const fromInitial =
    initial?.metadata?.channelMetadataRenderer?.externalId ??
    initial?.header?.c4TabbedHeaderRenderer?.channelId;
  if (typeof fromInitial === "string" && CHANNEL_ID_EXACT.test(fromInitial)) {
    return fromInitial;
  }
};

/**
 * Resolve the current channel's "uploads" playlist id.
 *
 * YouTube stores every channel's uploads as an implicit playlist whose id
 * is the channel id with the leading `"UC"` swapped for `"UU"`. Loading
 * that playlist is equivalent to the old "Play All" behaviour.
 *
 * Returns `undefined` when no channel id is available on the current page.
 */
export const getUploadsPlaylistId = (): string | undefined => {
  const channelId = getChannelId();
  return channelId ? `UU${channelId.slice(2)}` : undefined;
};
