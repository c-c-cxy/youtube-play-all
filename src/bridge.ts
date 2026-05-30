/**
 * MAIN-world bridge that exposes page-level data to the content script.
 *
 * Runs in the page's JavaScript context (`world: "MAIN"` in manifest.json)
 * so it can read Polymer element properties that are invisible to the
 * isolated-world content script. Writes the channel id to a `data-`
 * attribute on `<html>` that the content script picks up via
 * `document.documentElement.dataset`.
 */

const CHANNEL_ID_RE = /^UC[0-9A-Za-z_-]{22}$/;

const sync = (): void => {
  // YouTube keeps the previous page's <ytd-browse> in the DOM and marks
  // it `hidden` while a new one renders alongside it, so the unqualified
  // selector returns the stale element. :not([hidden]) picks the active
  // page.
  const browse = document.querySelector("ytd-browse:not([hidden])") as any;
  const data = browse?.data;

  const id: unknown =
    data?.metadata?.channelMetadataRenderer?.externalId ??
    data?.header?.c4TabbedHeaderRenderer?.channelId;

  const wrote = typeof id === "string" && CHANNEL_ID_RE.test(id);
  if (wrote) {
    document.documentElement.dataset.ytpaChannelId = id as string;
  } else {
    delete document.documentElement.dataset.ytpaChannelId;
  }

  console.log("[ytpa] bridge sync", {
    t: performance.now().toFixed(0),
    path: window.location.pathname,
    foundBrowse: !!browse,
    wrote: wrote ? id : null,
  });
};

document.addEventListener("yt-navigate-finish", sync);
sync();
