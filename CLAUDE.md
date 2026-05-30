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

Two triggers — both load-bearing:

1. **Initial `tryInject()` at script load** — critical for **background-tab opens** (middle-click "Open in new tab"). `yt-navigate-finish` does NOT fire at all on background-loaded tabs (verified empirically). By the time `document_idle` runs, the action row and the bridge's data attribute are already in place, so the initial pass is the only thing that injects.
2. **`yt-navigate-finish` listener** — handles SPA navigations on active tabs. Deferred with `setTimeout(…, 0)` so the bridge's synchronous handler writes the data attribute before the content script reads it.

Earlier revisions tried to "simplify" by collapsing to just one trigger; both attempts regressed. Don't remove either without verifying all three repros: (a) fresh load of a channel page, (b) same-tab SPA navigation from a video page to its channel page (covered by the `yt-navigate-finish` listener — the bridge architecture was built for this case), (c) middle-click "Open in new tab" on a channel link from a video page (covered by the initial `tryInject()`).

### Action-row injection (`src/utils/createPlayAllButton.ts`)

The injected button mirrors YouTube's native `<yt-button-shape>` DOM down to class names (`ytSpecButtonShapeNextTonal`, `ytSpecButtonShapeNextMono`, etc.) so it picks up theme, hover, and focus styling automatically. The marker class `play-all-injected-pabfyt` is checked on every call for idempotency. Don't change the DOM structure without verifying it still picks up YouTube's styling.

### Localization

`_locales/<chrome-locale>/messages.json` with two keys: `extName` and `playAllButtonLabel`. The button label must be byte-identical to YouTube's own `"PLAY_ALL"` string for that locale — never translate it by hand. Use the `add-locale` skill in `.claude/skills/add-locale/` which documents the `curl | grep '"PLAY_ALL"'` workflow.

Chrome uses underscored locale codes (`pt_BR`, `zh_CN`); YouTube's `hl` parameter uses hyphens (`pt-BR`, `zh-CN`); Hebrew is `he` in Chrome but `iw` on YouTube.

### Debugging

Both scripts log to the page console with a `[ytpa]` prefix. The README has a 5-step pipeline check (path → bridge attribute → ytd-browse data → action row → injected marker) for diagnosing missing-button reports.
