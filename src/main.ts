/**
 * Content script entry point.
 *
 * DOM-only content script: no `host_permissions` or CSP entries are needed
 * in manifest.json because we never fetch cross-origin resources — the
 * injected button links out via an anchor that the browser navigates
 * normally.
 *
 * Injection strategy: an initial `tryInject()` pass plus a
 * `yt-navigate-finish` listener for subsequent SPA navigations. The
 * MAIN-world bridge keeps the channel-id data attribute on `<html>` up
 * to date. The marker-class guard inside {@link createPlayAllButton}
 * makes re-entry idempotent.
 */

import {
  ACTION_ROW_SELECTOR,
  createPlayAllButton,
} from "./utils/createPlayAllButton";
import { isOnChannelPage } from "./utils/isOnYouTube";

console.log("[ytpa] content script loaded", {
  t: performance.now().toFixed(0),
  path: window.location.pathname,
  hasActionRow: !!document.querySelector("yt-flexible-actions-view-model"),
  hasChannelId: !!document.documentElement.dataset.ytpaChannelId,
});

const tryInject = (): void => {
  if (!isOnChannelPage()) return;
  const actionRow = document.querySelector(ACTION_ROW_SELECTOR);
  if (!actionRow) return;
  const channelId = document.documentElement.dataset.ytpaChannelId;
  if (channelId) createPlayAllButton(actionRow, `UU${channelId.slice(2)}`);
};

// Deferred so the MAIN-world bridge's synchronous yt-navigate-finish
// handler has already written the channel id data attribute.
document.addEventListener("yt-navigate-finish", () => {
  console.log("[ytpa] yt-navigate-finish", {
    t: performance.now().toFixed(0),
    path: window.location.pathname,
    hasActionRow: !!document.querySelector(ACTION_ROW_SELECTOR),
    hasChannelId: !!document.documentElement.dataset.ytpaChannelId,
  });
  setTimeout(tryInject, 0);
});

// Critical for background-tab opens (middle-click "Open in new tab"):
// `yt-navigate-finish` doesn't fire on those at all (verified
// empirically — no event log even after switching to the tab). The
// action row and the bridge's data attribute are already in place by
// the time `document_idle` runs, so this initial pass is the only
// thing that injects the button on background-loaded channel pages.
tryInject();
