# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` — production bundle to `dist/`
- `npm run watch` — development watch mode (inline source maps)
- `npm run typecheck` — `tsc --noEmit`
- `npm run pack` — build + zip to `build/youtube-play-all-<version>.zip` for Chrome Web Store upload
- No tests exist; CI (`.github/workflows/ci.yml`) runs typecheck + build only

## Architecture

The extension injects a "Play all" button into the action row on YouTube channel pages. The non-obvious complexity comes from getting the channel id while surviving YouTube's SPA navigation.

### Two content scripts, two JavaScript worlds

`manifest.json` registers two scripts:

- `dist/bridge.js` — `world: "MAIN"`, runs in the page's JS context.
- `dist/content.js` — default isolated world, has `chrome.*` APIs.

The bridge exists because the channel id lives on a Polymer property (`document.querySelector("ytd-browse").data`), and Polymer-attached JS properties are invisible from the isolated world. The bridge reads `data` and forwards the id to the content script by writing it to `<html data-ytpa-channel-id="UC…">`, which the content script reads back via `document.documentElement.dataset.ytpaChannelId`.

Webpack has two entry points (`src/main.ts` → `content.js`, `src/bridge.ts` → `bridge.js`); see `webpack.config.js`.

### Channel-id extraction gotchas

Three sources we explored are NOT viable — don't reintroduce them:

- `<meta property="og:url">`, `<link rel="canonical">`, RSS link in `<head>` — these stay stale after SPA navigation and never update.
- `window.ytInitialData` — only updated for the initial page load; never updates on SPA navigation.
- `document.querySelector("ytd-browse")` — unqualified, this can return a stale hidden element. YouTube keeps the previous page's `ytd-browse` in the DOM with the `hidden` attribute while the new one renders. Use `ytd-browse:not([hidden])` to get the active page.

### Injection triggers (`src/main.ts`)

A single debounced `MutationObserver` on `document.body` (`childList` + `subtree`), plus one initial `tryInject()` call. The observer subsumes every trigger we'd otherwise wire up separately — SPA navigation, initial hydration, and the action-row re-render on window resize all surface as DOM mutations, and each fires a (debounced) re-check. `tryInject()` is cheap and idempotent (marker-class guard), so re-running it on every mutation burst is safe.

Why an observer rather than a `yt-navigate-finish` listener (an earlier revision, `4fef00a`, tried that):

- `yt-navigate-finish` does NOT fire on **background-tab opens** (middle-click "Open in new tab") — verified empirically. MutationObservers fire regardless of tab focus, so the observer covers this case; the initial `tryInject()` is a backstop for when the row is already present before the first callback.
- `yt-navigate-finish` fires **once per navigation**, so it can't re-inject when YouTube **rebuilds the flexible action row on resize** and discards our button. This regressed when the observer was removed — restoring the observer is the fix.

`tryInject()` queries the action row through `ytd-browse:not([hidden]) yt-flexible-actions-view-model`, not the bare element selector. The `:not([hidden])` scope is load-bearing for the same reason it is in the bridge: a stale hidden `ytd-browse` (most often a previously-visited channel, lingering after a video → channel navigation) keeps its own `yt-flexible-actions-view-model` first in document order, and an unqualified query injects the button into that hidden view.

Don't replace the observer with narrower event triggers without verifying all four repros: (a) fresh load of a channel page, (b) same-tab SPA navigation from a video page to its channel page, (c) middle-click "Open in new tab" on a channel link from a video page, (d) resizing the window on a channel page — the button must survive (re-appear after) the resize.

### Action-row injection (`src/utils/createPlayAllButton.ts`)

The injected button mirrors YouTube's native `<yt-button-shape>` DOM down to class names (`ytSpecButtonShapeNextTonal`, `ytSpecButtonShapeNextMono`, etc.) so it picks up theme, hover, and focus styling automatically. The marker class `play-all-injected-pabfyt` is checked on every call for idempotency. Don't change the DOM structure without verifying it still picks up YouTube's styling.

### Localization

`_locales/<chrome-locale>/messages.json` with two keys: `extName` and `playAllButtonLabel`. The button label must be byte-identical to YouTube's own `"PLAY_ALL"` string for that locale — never translate it by hand. Use the `add-locale` skill in `.claude/skills/add-locale/` which documents the `curl | grep '"PLAY_ALL"'` workflow.

Chrome uses underscored locale codes (`pt_BR`, `zh_CN`); YouTube's `hl` parameter uses hyphens (`pt-BR`, `zh-CN`); Hebrew is `he` in Chrome but `iw` on YouTube.

### Debugging

Both scripts log to the page console with a `[ytpa]` prefix. The README has a 5-step pipeline check (path → bridge attribute → ytd-browse data → action row → injected marker) for diagnosing missing-button reports.
