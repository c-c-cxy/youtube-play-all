---
name: release
description: Cut a release of the extension — bump the version in both manifest files, add a CHANGELOG entry, commit, and produce the Chrome Web Store zip. Use when the user asks to "ship", "release", "cut a release", "bump and pack", or similar after a fix or feature is ready to ship.
---

# Cut a release

The release artifact is `build/youtube-play-all-<version>.zip`, produced by `npm run pack` and uploaded manually to the Chrome Web Store. This skill stops short of pushing and uploading — those are user-driven actions.

## 1. Ask the user two questions up front

Use a single `AskUserQuestion` call with both questions (parallel):

**Q1 — release type** (default: patch):
- "Patch (Recommended)" → bump Z in `X.Y.Z`
- "Minor" → bump Y, reset Z to 0
- "Major" → bump X, reset Y and Z to 0

The repo has only ever used patch bumps (`0.1.0 → 0.1.1 → … → 0.1.4`). Reach for minor/major only when the user explicitly chose it.

**Q2 — staging scope** (default: no):
- "No, release commit only (Recommended)" → stage only `package.json`, `manifest.json`, `CHANGELOG.md`. Other working-tree changes stay unstaged.
- "Yes, include all changes" → also stage every other modified/untracked file. Surface the list back to the user before committing so they can spot anything that shouldn't ride along.

## 2. Draft the changelog entry

You also need a short description of what changed for the commit and the CHANGELOG. If the user didn't give you one, draft it from the working-tree diff and recent commits and confirm before writing it.

CHANGELOG format follows [Keep a Changelog](https://keepachangelog.com/). Mirror the style of the most recent entries in [CHANGELOG.md](../../../CHANGELOG.md) — one bullet under `### Fixed`, `### Changed`, `### Added`, or `### Removed`, written as a "what + why" sentence.

## 3. Apply the changes

### Confirm the current version

[package.json](../../../package.json) and [manifest.json](../../../manifest.json) must already match. If they don't, stop and ask the user — that's a sign of a half-finished prior release.

### Bump the version

Apply the bump from Q1 to both `package.json` and `manifest.json`.

### Add the CHANGELOG entry

Insert a new section at the top of the version list, above the most recent entry:

```markdown
## [<new-version>] - <YYYY-MM-DD>

### <Fixed|Changed|Added|Removed>
- <one-sentence "what + why" bullet>
```

Use today's date in ISO format.

### Stage and commit

Stage per Q2's answer. Commit with:

```bash
git commit -m "v<new-version> <short description>"
```

Commit message style from recent history:
- `v0.1.4 pick active ytd-browse element`
- `v0.1.2 new locales`

Short, lowercase, no leading verb, prefixed with `v<version>`. Pre-commit hooks run on the project; do not skip them.

## 4. Build + pack

```bash
npm run pack
```

This runs `npm run build` then `node scripts/pack.js`, which zips `manifest.json`, `icon.png`, `dist/`, and `_locales/` into `build/youtube-play-all-<version>.zip`. Report the output path and size to the user (the script prints `Wrote build/youtube-play-all-<version>.zip (<size> KiB)`).

## 5. Report next steps

Tell the user what remains for them:

- Push to main: `git push origin main`
- Upload `build/youtube-play-all-<new-version>.zip` to the Chrome Web Store developer dashboard.

Do not do either yourself unless the user explicitly asks — both are externally visible.

## Notes

- The `pack` script reads the version from `manifest.json` to name the zip, so the version bump must happen before packing.
- CI ([.github/workflows/ci.yml](../../../.github/workflows/ci.yml)) runs `typecheck` + `build` on every push to main; the build step here is mainly to surface errors locally before pushing.
