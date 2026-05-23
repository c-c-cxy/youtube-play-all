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
  const browse = document.querySelector("ytd-browse") as any;
  const data = browse?.data;

  const id: unknown =
    data?.metadata?.channelMetadataRenderer?.externalId ??
    data?.header?.c4TabbedHeaderRenderer?.channelId;

  if (typeof id === "string" && CHANNEL_ID_RE.test(id)) {
    document.documentElement.dataset.ytpaChannelId = id;
  } else {
    delete document.documentElement.dataset.ytpaChannelId;
  }
};

document.addEventListener("yt-navigate-finish", sync);
sync();
