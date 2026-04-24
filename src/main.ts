/**
 * Content script entry point.
 *
 * DOM-only content script: no `host_permissions` or CSP entries are needed
 * in manifest.json because we never fetch cross-origin resources — the
 * injected button links out via an anchor that the browser navigates
 * normally.
 *
 * Injection strategy: a single persistent `MutationObserver` on
 * `document.body`. It subsumes three separate triggers we used to wire up
 * (initial load, `yt-navigate-finish`, and `window` resize) into one
 * mechanism. Whenever YouTube mutates the page — SPA navigation, lazy
 * hydration, layout re-render on resize — we re-check for the action row
 * and inject if needed. The marker-class guard inside
 * {@link createPlayAllButton} makes re-entry idempotent.
 */

import {
  ACTION_ROW_SELECTOR,
  createPlayAllButton,
} from "./utils/createPlayAllButton";
import { debounce } from "./utils/debounce";
import { getUploadsPlaylistId } from "./utils/getChannelId";
import { isOnChannelPage } from "./utils/isOnYouTube";

/**
 * Attempt a single injection pass.
 *
 * Cheap and safe to call repeatedly — every step short-circuits quickly
 * when its precondition isn't met, and the final injection is guarded by
 * the marker-class check inside {@link createPlayAllButton}.
 */
const tryInject = (): void => {
  if (!isOnChannelPage()) return;
  const actionRow = document.querySelector(ACTION_ROW_SELECTOR);
  if (!actionRow) return;
  const playlistId = getUploadsPlaylistId();
  if (playlistId) createPlayAllButton(actionRow, playlistId);
};

// 100ms debounce coalesces the burst of mutations YouTube emits during a
// single page render into a single injection attempt.
new MutationObserver(debounce(tryInject, 100)).observe(document.body, {
  childList: true,
  subtree: true,
});

// Kick off immediately in case the action row is already present before
// our first mutation callback fires.
tryInject();
