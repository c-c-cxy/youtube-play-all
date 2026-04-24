/**
 * Custom element YouTube uses to host channel-header action buttons
 * (Subscribe, Join, …). We inject our button as its last child.
 */
export const ACTION_ROW_SELECTOR = "yt-flexible-actions-view-model";

/**
 * Marker class on the injected wrapper. Used as an idempotency guard so
 * repeated calls to {@link createPlayAllButton} don't add duplicate
 * buttons when YouTube re-renders the action row.
 */
export const MARKER_CLASS = "play-all-injected-pabfyt";

/**
 * Static markup for the play-triangle icon, mirroring the inner tree
 * YouTube emits for `yt-icon-shape`. Safe to use with `innerHTML`
 * because it contains no dynamic data.
 */
const PLAY_ICON_SVG = `<span class="ytIconWrapperHost" style="width:24px;height:24px;"><span class="yt-icon-shape ytSpecIconShapeHost"><div style="width:100%;height:100%;display:block;fill:currentcolor;"><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events:none;display:inherit;width:100%;height:100%;"><path d="M5 4.623V19.38a1.5 1.5 0 002.26 1.29L22 12 7.26 3.33A1.5 1.5 0 005 4.623Z"></path></svg></div></span></span>`;

/**
 * Static markup for `yt-touch-feedback-shape`'s stroke/fill children,
 * which power YouTube's hover ripple.
 */
const TOUCH_FEEDBACK_HTML = `<div class="ytSpecTouchFeedbackShapeStroke"></div><div class="ytSpecTouchFeedbackShapeFill"></div>`;

/**
 * Inject a "Play all" button into the channel action row.
 *
 * The DOM structure matches YouTube's native buttons so the button picks
 * up theme, hover, and focus styling automatically:
 *
 *   div.ytFlexibleActionsViewModelAction (wrapper, also carries MARKER_CLASS)
 *     yt-button-shape
 *       a.ytSpecButtonShapeNext* (tonal / mono / size-m / icon-leading)
 *         div.ytSpecButtonShapeNextIcon       — play-triangle SVG
 *         div.ytSpecButtonShapeNextButtonTextContent — label
 *         yt-touch-feedback-shape             — hover ripple
 *
 * Clicking opens the uploads playlist in a new tab. The anchor is a real
 * link (`<a href>` with `target="_blank"`) so middle-click, ctrl-click,
 * and "open in new tab" behave natively.
 *
 * Idempotent: bails early if the action row already contains a wrapper
 * with {@link MARKER_CLASS}.
 *
 * @param actionRow Result of `document.querySelector(ACTION_ROW_SELECTOR)`.
 * @param playlistId YouTube "UU…" uploads playlist id.
 */
export const createPlayAllButton = (
  actionRow: Element,
  playlistId: string,
): void => {
  if (actionRow.querySelector(`.${MARKER_CLASS}`)) return;

  const label = chrome.i18n.getMessage("playAllButtonLabel");

  const wrapper = document.createElement("div");
  wrapper.className = `${MARKER_CLASS} ytFlexibleActionsViewModelAction`;

  const buttonShape = document.createElement("yt-button-shape");

  const link = document.createElement("a");
  link.className = [
    "ytSpecButtonShapeNextHost",
    "ytSpecButtonShapeNextTonal",
    "ytSpecButtonShapeNextMono",
    "ytSpecButtonShapeNextSizeM",
    "ytSpecButtonShapeNextIconLeading",
  ].join(" ");
  link.href = `https://www.youtube.com/playlist?list=${playlistId}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", label);
  link.setAttribute("aria-haspopup", "false");
  link.setAttribute("aria-current", "false");
  link.setAttribute("aria-disabled", "false");

  const iconDiv = document.createElement("div");
  iconDiv.className = "ytSpecButtonShapeNextIcon";
  iconDiv.setAttribute("aria-hidden", "true");
  iconDiv.innerHTML = PLAY_ICON_SVG;

  const textDiv = document.createElement("div");
  textDiv.className = "ytSpecButtonShapeNextButtonTextContent";
  const textSpan = document.createElement("span");
  textSpan.className =
    "ytAttributedStringHost ytAttributedStringWhiteSpaceNoWrap";
  textSpan.setAttribute("role", "text");
  textSpan.textContent = label;
  textDiv.appendChild(textSpan);

  const feedback = document.createElement("yt-touch-feedback-shape");
  feedback.className =
    "ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse";
  feedback.setAttribute("aria-hidden", "true");
  feedback.innerHTML = TOUCH_FEEDBACK_HTML;

  link.appendChild(iconDiv);
  link.appendChild(textDiv);
  link.appendChild(feedback);
  buttonShape.appendChild(link);
  wrapper.appendChild(buttonShape);
  actionRow.appendChild(wrapper);

  wrapper.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 100,
    fill: "forwards",
    easing: "ease-in",
  });
};
