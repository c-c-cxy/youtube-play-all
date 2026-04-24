---
name: add-locale
description: Add or verify a Chrome extension locale under _locales/ by fetching YouTube's actual "PLAY_ALL" string. Use when the user asks to add a language, verify an existing locale, or update translations to match YouTube.
---

# Add / verify a locale

Chrome extension locales live under [_locales/](../../../_locales/). Each locale has `messages.json` with two keys: `extName` and `playAllButtonLabel`. The source of truth for `playAllButtonLabel` is YouTube's own embedded `"PLAY_ALL"` string — never translate it yourself.

## Workflow

### 1. Resolve the locale code

Chrome uses locale codes with underscores (`pt_BR`, `zh_CN`), YouTube's `hl` parameter uses hyphens (`pt-BR`, `zh-CN`). Map accordingly. Hebrew is `he` in Chrome but `iw` on YouTube's `hl`.

### 2. Fetch YouTube's actual string

Use curl against a channel page with a "Play all" button (e.g. `@amua_asmr`) and grep the embedded string dictionary:

```bash
curl -sS -L -A "Mozilla/5.0" -H "Accept-Language: <hl>" "https://www.youtube.com/@amua_asmr?hl=<hl>" | grep -oE '"PLAY_ALL":"[^"]+"' | head -1
```

For batch verification across many locales:

```bash
for lang in fi hu da sl el; do
  r=$(curl -sS -L -A "Mozilla/5.0" -H "Accept-Language: $lang" "https://www.youtube.com/@amua_asmr?hl=$lang" | grep -oE '"PLAY_ALL":"[^"]+"' | head -1)
  echo "$lang -> $r"
done
```

If the fetch returns nothing, the locale may not be supported by YouTube — fall back to asking the user.

### 3. Write messages.json

Create `_locales/<code>/messages.json` using this exact shape (match [_locales/en/messages.json](../../../_locales/en/messages.json)):

```json
{
  "extName": {
    "message": "<localized extension name including the button label>",
    "description": "Extension name."
  },
  "playAllButtonLabel": {
    "message": "<YouTube's exact PLAY_ALL string>",
    "description": "Label for the injected button."
  }
}
```

`playAllButtonLabel.message` must be byte-identical to what curl returned. `extName.message` should embed the same button label in a natural-sounding extension name in the target language.

### 4. Verify existing locales

To audit whether existing files still match YouTube (translations drift over time — `pt_BR` and `pl` both changed recently), loop over every subdirectory of `_locales/` and diff against the live `PLAY_ALL` string. Report mismatches as a table and update the offending files.

## Notes

- Don't rely on WebFetch — YouTube is a JS SPA and the button text isn't in the static HTML returned by WebFetch's summarizer. `curl | grep` on the raw HTML works because `PLAY_ALL` lives in an inline JS string dictionary.
- Norwegian: YouTube returns `Spill av alle` for both `no` and `nb`. Ship whichever code(s) Chrome Web Store requires for your audience.
- When YouTube consolidates regional variants (e.g. pt-BR and pt-PT currently share "Reproduzir todos"), match YouTube's current string rather than historical convention.
