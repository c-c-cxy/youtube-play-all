/**
 * Content script entry point.
 *
 * DOM-only content script: no `host_permissions` or CSP entries are needed
 * in manifest.json because we never fetch cross-origin resources — the
 * injected button links out via an anchor that the browser navigates
 * normally.
 *
 * Injection strategy: a single `yt-navigate-finish` listener. YouTube
 * fires that event after every navigation (fresh load and SPA), at which
 * point the MAIN-world bridge has written the channel id to a data
 * attribute we can read. The marker-class guard inside
 * {@link createPlayAllButton} makes re-entry idempotent.
 */

import {
  ACTION_ROW_SELECTOR,
  createPlayAllButton,
} from "./utils/createPlayAllButton";
import { isOnChannelPage } from "./utils/isOnYouTube";

const tryInject = (): void => {
  if (!isOnChannelPage()) return;
  const actionRow = document.querySelector(ACTION_ROW_SELECTOR);
  if (!actionRow) return;
  const channelId = document.documentElement.dataset.ytpaChannelId;
  if (channelId) createPlayAllButton(actionRow, `UU${channelId.slice(2)}`);
};

// Deferred so the MAIN-world bridge's synchronous yt-navigate-finish
// handler has already written the channel id data attribute.
document.addEventListener("yt-navigate-finish", () =>
  setTimeout(tryInject, 0),
);
