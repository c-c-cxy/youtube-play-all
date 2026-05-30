## Play All button for YouTube Chrome extension

[Chrome web store link](https://chromewebstore.google.com/detail/Play%20All%20button%20for%20YouTube/lnngonmdpkejhjpobbbonechojbncoll)

I usually find myself in need of this feature however YouTube removed it after launching shorts. There were a few hacks such as a bookmarklet but either they require some manual editing or they stopped working. So I finally decided to make this extension.

If you want localization for a specific language, raise an issue or a pull request of your own.

## Debugging

The extension logs to the page console with a `[ytpa]` prefix — filter for that string in DevTools to see when the bridge ran, when `yt-navigate-finish` fired, and what state each saw.

If the button isn't appearing on a channel page, open DevTools (F12) on that tab and paste these into the console to walk the injection pipeline:

```js
// 1. Are we on a channel page?
window.location.pathname; // expect /channel/UC… or /@handle

// 2. Did the bridge identify the current channel?
document.documentElement.dataset.ytpaChannelId; // expect "UC…"

// 3. If (2) is undefined: does YouTube's page data have the channel id?
document.querySelector("ytd-browse:not([hidden])")?.data?.metadata
  ?.channelMetadataRenderer?.externalId;

// 4. Is YouTube's action row in the DOM yet?
document.querySelector("yt-flexible-actions-view-model");

// 5. Did we already inject the button?
document.querySelector(".play-all-injected-pabfyt");
```

A healthy state on a channel page is: (1) channel URL, (2) and (3) return the same `UC…` id, (4) returns the action-row element, (5) returns our injected wrapper.
