# Changelog

All notable changes to this extension are documented in this file.
The format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [0.1.5] - 2026-05-30

### Fixed
- Button now appears on background-tab opens (middle-click "Open in new tab" on a channel link from a video page). YouTube never fires `yt-navigate-finish` on background-loaded tabs, so the single-listener strategy from 0.1.3 never injected; restored an initial `tryInject()` pass at script load, which runs once `document_idle` fires with the action row and bridge data attribute already in place.

### Added
- `[ytpa]`-prefixed console logging across the bridge and content script, plus a README "Debugging" section with a 5-step pipeline check (path → bridge attribute → `ytd-browse` data → action row → injected marker) for diagnosing missing-button reports.

## [0.1.4] - 2026-05-27

### Fixed
- Bridge was reading the wrong `<ytd-browse>` element. YouTube keeps the previous page's element in the DOM marked `hidden` while the new one renders alongside, so the unqualified `document.querySelector("ytd-browse")` returned the stale page's data — `metadata.channelMetadataRenderer` was missing and the bridge silently skipped writing the channel id. Switched to `ytd-browse:not([hidden])` to pick the active page.

## [0.1.3] - 2026-05-23

### Fixed
- Button now appears after in-page SPA navigation from a video to a channel page. Previously every channel-id source was stale in this case: `<head>` meta tags (`og:url`, `<link rel="canonical">`, RSS link) never updated after the initial page load, and `window.ytInitialData` is in the page's world (invisible from a content script's isolated world). The button would only appear if the channel page was opened in a fresh tab.

### Changed
- New MAIN-world bridge script (`dist/bridge.js`, `world: "MAIN"` in `manifest.json`) reads `document.querySelector("ytd-browse").data` — the only source that updates during SPA navigation — and writes the channel id to `<html data-ytpa-channel-id="UC…">`, which the content script reads via `document.documentElement.dataset.ytpaChannelId`.
- Injection trigger simplified to a single `yt-navigate-finish` listener (YouTube fires it on both fresh loads and SPA navigations).

### Removed
- `MutationObserver` on `document.body` and the 100 ms debounce — single-event trigger has no bursts to coalesce.
- `getChannelId.ts` and its `<head>` meta-tag scraping; the dead `window.ytInitialData` fallback never worked from the content script.

## [0.1.2] - 2026-04-24

### Added
- 14 new locales, covering every language with active weekly users that we weren't already shipping: Azerbaijani (`az`), Bulgarian (`bg`), Danish (`da`), Greek (`el`), Finnish (`fi`), Hebrew (`he`), Croatian (`hr`), Hungarian (`hu`), Latvian (`lv`), Norwegian Bokmål (`nb`), Norwegian (`no`), Slovak (`sk`), Slovenian (`sl`), Serbian (`sr`).
- `add-locale` project skill ([.claude/skills/add-locale/SKILL.md](.claude/skills/add-locale/SKILL.md)) that documents the `curl | grep '"PLAY_ALL"'` workflow for sourcing YouTube's exact button string, so future locale additions stay byte-identical to YouTube's UI.

### Changed
- Re-verified every existing locale against YouTube's live `"PLAY_ALL"` string and corrected drift:
  - `pl`: *Odtwórz wszystkie* → **Odtwórz wszystko**
  - `pt_BR`: *Reproduzir tudo* → **Reproduzir todos** (YouTube now uses the same string for pt-BR and pt-PT)

## [0.1.1] - 2026-04-23

### Added
- 13 new locales: Czech (`cs`), Filipino (`fil`), Indonesian (`id`), Korean (`ko`), Dutch (`nl`), Polish (`pl`), European Portuguese (`pt_PT`), Romanian (`ro`), Swedish (`sv`), Thai (`th`), Turkish (`tr`), Ukrainian (`uk`), Vietnamese (`vi`), Traditional Chinese (`zh_TW`).
- TypeScript migration: all source now `.ts`, strict mode, with `@types/chrome` replacing prior `@ts-ignore` comments.
- `pack` npm script that produces `build/youtube-play-all-<version>.zip` ready for Chrome Web Store upload (uses `archiver`).
- GitHub Actions CI: typechecks and builds on every PR and push to `main`, uploads the dist as an artifact.
- Inline source maps in development builds for easier DevTools debugging.
- JSDoc/TSDoc documentation across every source file.

### Changed
- Injected button now mirrors YouTube's native button DOM (`<yt-button-shape>` wrapper, play-triangle SVG icon, `ytAttributedStringHost` text span, `<yt-touch-feedback-shape>` hover ripple) for pixel-accurate parity with Subscribe/Join.
- Button variant switched to `Tonal` with `IconLeading` to match adjacent action-row buttons.
- Single long-lived `MutationObserver` on `document.body` replaces the earlier trio of triggers (initial call + `yt-navigate-finish` + `resize`); 100 ms debounce coalesces mutation bursts.
- `createPlayAllButton` is now synchronous and takes the pre-located action row as a parameter; the `UC → UU` playlist-id transform moved to a dedicated `getUploadsPlaylistId()` helper.
- Locale translations verified against YouTube's own UI (via `Accept-Language`-tagged `curl` of a playlist page) and corrected where they diverged:
  - `de`: *Alle wiedergeben* → **Alle abspielen**
  - `es`: *Reproduzir tudo* (was Portuguese by mistake) → **Reproducir todo**
  - `it`: *Riproduci tutti* → **Riproduci tutto**
  - `sw`: *Spela upp alla* (was Swedish by mistake) → **Cheza zote**
  - `fil`: *I-play lahat* → **I-play ang lahat**
  - `ro`: *Redare totală* → **Redă-le pe toate**
  - `pt_PT`: now distinct from `pt_BR` → **Reproduzir todos**
- Invalid Chrome locale folders renamed: `ch` → `zh_CN`, `kr` → `ko`, `pt-br` → `pt_BR`. Chrome had been silently ignoring the old names, so Chinese/Korean/Brazilian-Portuguese users were seeing English.
- `dist/` and `build/` no longer tracked in git; CI rebuilds the bundle on every push.
- Webpack config exports a function of `(env, argv)` so source maps enable only in development.
- `tsconfig.json` uses `moduleResolution: "bundler"` (the deprecated `node10` alias is gone).

### Removed
- `waitForElement` utility — the unified observer in `main.ts` locates the action row directly.
- `isOnYouTube()` helper — manifest `matches` already restricts injection.
- `jsconfig.json` (replaced by `tsconfig.json`).

## [0.1.0] - 2026-04-23

### Added
- Injected button now includes both the new camelCase (`ytSpecButtonShapeNext*`) and legacy kebab-case (`yt-spec-button-shape-next*`) class sets so styling survives YouTube's in-progress class-name migration.
- `getChannelId` falls back to `<link rel="canonical">` and `ytInitialData` when the `og:url` meta tag is missing.
- `waitForElement` supports a `timeoutMs` option (default 10s) and an `AbortSignal`, preventing leaked observers on SPA navigation.
- `build` and `watch` npm scripts.

### Changed
- Button is rendered as an `<a target="_blank" rel="noopener noreferrer">` instead of a `<button>` with `window.open`, restoring middle-click, ctrl-click, and "open in new tab" behaviour.
- SPA navigation is detected via the native `yt-navigate-finish` event instead of a body-wide `MutationObserver` on `document.location.href`.
- Content script `matches` narrowed from `<all_urls>` to `*://*.youtube.com/*` and `run_at` switched to `document_idle`.
- `start()` now early-returns on non-channel pages (`/channel/*`, `/@handle`).
- Duplicate-injection guard uses a CSS class marker instead of a `data-*` attribute.
- Version scheme switched from `0.0.0.N` to semver.

### Removed
- Unused toolbar `action` entry from the manifest.
- 500 ms `setTimeout` after navigation — `waitForElement` handles timing.

## [0.0.0.5] - prior

- Localization (initial languages).
- Domain check, responsiveness improvements, duplicate-prevention guard, webpack build, icon.
