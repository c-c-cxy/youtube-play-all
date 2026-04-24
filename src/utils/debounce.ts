/**
 * Trailing-edge debounce.
 *
 * Returns a wrapper that delays invocation of `callback` until `wait`ms
 * have elapsed since the last call. Each new call resets the timer, so
 * bursts collapse into a single delayed invocation with the last set of
 * arguments.
 *
 * Used here to collapse the flurry of DOM mutations YouTube emits during
 * a single page render into one injection attempt. Generic over the
 * callback's argument tuple so the returned wrapper keeps the same
 * signature.
 */
export const debounce = <A extends unknown[]>(
  callback: (...args: A) => void,
  wait: number,
): ((...args: A) => void) => {
  let timeoutId: number | undefined;
  return (...args: A) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
};
