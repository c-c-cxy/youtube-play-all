/**
 * Content script entry point.
 *
 * DOM-only content script: no `host_permissions` or CSP entries are needed
 * in manifest.json because we never fetch cross-origin resources — the
 * injected button links out via an anchor that the browser navigates
 * normally.
 *
 * Injection strategy: a single persistent, debounced `MutationObserver`
 * on `document.body`. It subsumes the separate triggers we'd otherwise
 * wire up (initial load, `yt-navigate-finish`, and the action-row
 * re-render on window resize) into one mechanism: whenever YouTube
 * mutates the page — SPA navigation, lazy hydration, or the flexible
 * action row reflowing on resize — we re-check for the action row and
 * inject if needed. The MAIN-world bridge keeps the channel-id data
 * attribute on `<html>` up to date; the marker-class guard inside
 * {@link createPlayAllButton} makes re-entry idempotent.
 *
 * Why an observer rather than a `yt-navigate-finish` listener: that
 * event doesn't fire on background-tab opens, and it fires once per
 * navigation — so it can't re-inject when YouTube rebuilds the action
 * row on resize and discards our button. The observer reacts to the
 * actual DOM change in every case.
 */

import {
  ACTION_ROW_SELECTOR,
  createPlayAllButton,
} from "./utils/createPlayAllButton";
import { debounce } from "./utils/debounce";
import { isOnChannelPage } from "./utils/isOnYouTube";

console.log("[ytpa] content script loaded", {
  t: performance.now().toFixed(0),
  path: window.location.pathname,
  hasActionRow: !!document.querySelector(ACTION_ROW_SELECTOR),
  hasChannelId: !!document.documentElement.dataset.ytpaChannelId,
});

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
  const channelId = document.documentElement.dataset.ytpaChannelId;
  if (channelId) createPlayAllButton(actionRow, `UU${channelId.slice(2)}`);
};

// 100ms debounce coalesces the burst of mutations YouTube emits during a
// single page render (or action-row re-render on resize) into a single
// injection attempt.
new MutationObserver(debounce(tryInject, 100)).observe(document.body, {
  childList: true,
  subtree: true,
});

// Kick off immediately in case the action row and channel id are already
// present before our first mutation callback fires — notably background-
// tab opens (middle-click "Open in new tab"), where the page is fully
// rendered by the time the content script runs.
tryInject();
