/**
 * Return true when the current URL is a channel page.
 *
 * Channel URLs come in two shapes post-2022:
 *   - Legacy opaque id:  `youtube.com/channel/UCxxxx…`
 *   - Handle:            `youtube.com/@handle`
 *
 * Older `/c/customname` and `/user/username` paths redirect to one of
 * the above before content scripts see them, so we don't match them.
 *
 * Note: we don't also check `hostname === "youtube.com"` — the manifest
 * `matches` pattern already restricts content-script injection to the
 * YouTube origin.
 */
export const isOnChannelPage = (): boolean => {
  const { pathname } = window.location;
  return /^\/(channel\/|@)/.test(pathname);
};
