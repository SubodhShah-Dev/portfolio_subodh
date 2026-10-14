/**
 * Section anchor landing zone: the sticky header offset that `scroll-mt-24`
 * on every `<Section>` already reserves. Native scrollIntoView honors the
 * target's own scroll-margin, so `scrollToTarget` must NOT pass a matching
 * offset as well (double-subtracting would land anchors below the scrollspy
 * threshold). The tolerance covers float sub-pixel scroll positions.
 */
export const NAV_ANCHOR_OFFSET = 96;
export const NAV_ANCHOR_TOLERANCE = 6;

/** Frames to wait for an anchor to mount before giving up (~1s at 60fps). */
const TARGET_WAIT_FRAMES = 60;

// --- Flight announcements: every scroll initiation broadcasts its
// destination ("") before moving, so the nav scrollspy can light the
// clicked link instantly instead of chasing the scroll position through
// every section band the flight passes (§7 round 8: the pill used to
// show Home → About first on cross-route arrivals).
type FlightListener = (id: string) => void;

const flightListeners = new Set<FlightListener>();

/** Subscribe to flight announcements; returns the unsubscribe function. */
export function onFlight(listener: FlightListener): () => void {
  flightListeners.add(listener);
  return () => {
    flightListeners.delete(listener);
  };
}

function announce(id: string): void {
  for (const listener of flightListeners) listener(id);
}

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scroll to a section target with the browser's native smooth scrolling.
 *
 * Layout can shift while the flight runs (the collapsing mobile menu, late
 * images), so on `scrollend` we re-measure once and re-anchor if the target
 * missed the header band. One retry is enough for the shifts we've measured;
 * the retry is skipped entirely when the visitor takes over (any wheel,
 * touch, keydown, or pointerdown cancels it) or when `scrollend` is
 * unsupported (older Safari) — graceful degradation, never a yank.
 */
export function scrollToTarget(target: HTMLElement, attempt = 0): void {
  const reduced = reducedMotion();
  target.scrollIntoView({
    behavior: reduced ? "auto" : "smooth",
    block: "start",
  });
  if (attempt > 0 || reduced || typeof window === "undefined") return;
  if (!("onscrollend" in window)) return;

  let cancelled = false;
  const cleanup = (): void => {
    window.removeEventListener("scrollend", onEnd);
    window.removeEventListener("wheel", cancel, { capture: true });
    window.removeEventListener("touchstart", cancel, { capture: true });
    window.removeEventListener("keydown", cancel, { capture: true });
    window.removeEventListener("pointerdown", cancel, { capture: true });
  };
  const cancel = (): void => {
    cancelled = true;
    cleanup();
  };
  const onEnd = (): void => {
    cleanup();
    if (cancelled || !target.isConnected) return;
    const top = target.getBoundingClientRect().top;
    if (Math.abs(top - NAV_ANCHOR_OFFSET) > NAV_ANCHOR_TOLERANCE) {
      scrollToTarget(target, attempt + 1);
    }
  };
  window.addEventListener("scrollend", onEnd, { once: true });
  window.addEventListener("wheel", cancel, { capture: true, passive: true });
  window.addEventListener("touchstart", cancel, {
    capture: true,
    passive: true,
  });
  window.addEventListener("keydown", cancel, { capture: true });
  window.addEventListener("pointerdown", cancel, { capture: true, passive: true });
}

/** Return to the top of the page with native scrolling. */
export function scrollToTop(): void {
  // Already at the top, the intent adds nothing the spy doesn't know —
  // and announcing it would hold an empty intent over the position spy
  // until the hand-back expires (breaks position-owned highlights in
  // tests and on a freshly loaded page).
  if (window.scrollY > 0) announce("");
  window.scrollTo({
    top: 0,
    behavior: reducedMotion() ? "auto" : "smooth",
  });
}

/**
 * Scroll to a section by id — waiting for the element to mount.
 *
 * A cross-route navigation updates the URL before the destination DOM
 * swaps in, so a one-shot getElementById finds nothing and the click dies
 * silently (the layout effect's deps never change again, so nothing ever
 * retries). Poll one frame at a time until the anchor exists, then take
 * the normal flight; give up after the cap so a dead hash can't loop.
 */
export function scrollToId(id: string, attempt = 0): void {
  // Announce on every attempt: the wait for a cross-route anchor to mount
  // runs with no animation active, so re-stating the intent keeps it alive
  // (and resets the scrollspy's hand-back) until the flight starts.
  announce(id);
  const target = document.getElementById(id);
  if (target !== null) {
    scrollToTarget(target);
    return;
  }
  if (attempt >= TARGET_WAIT_FRAMES) return;
  requestAnimationFrame(() => scrollToId(id, attempt + 1));
}
