import Lenis from "lenis";

let instance: Lenis | null = null;
let frame = 0;

/**
 * Section anchor landing zone: the sticky header offset that `scroll-mt-24`
 * on every `<Section>` already reserves. lenis subtracts the target's
 * scroll-margin itself, so `scrollToTarget` must NOT pass a matching offset
 * as well (double-subtracting landed anchors at 192px, below the scrollspy
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

/**
 * True while a programmatic lenis flight runs. lenis marks it "smooth"
 * from the animation's first frame until `reset()` flips it back on
 * completion; native gestures (scrollbar drag, unsmoothed touch) are
 * "native" or false, so a visitor scrolling by hand is never counted
 * as a flight in progress.
 */
export function isFlying(): boolean {
  return instance !== null && instance.isScrolling === "smooth";
}

/** Start inertial scrolling for the public shell; returns its teardown. */
export function initLenis(): () => void {
  destroyLenis();
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  instance = lenis;
  const loop = (time: number): void => {
    lenis.raf(time);
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  return destroyLenis;
}

export function destroyLenis(): void {
  if (frame !== 0) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  instance?.destroy();
  instance = null;
}

/**
 * Scroll to a section target — lenis when active, native otherwise.
 *
 * Layout can shift while the flight runs (the collapsing mobile menu, late
 * images), so after landing we re-measure once and re-anchor if the target
 * missed the header band; one retry is enough for the shifts we've measured.
 */
export function scrollToTarget(target: HTMLElement, attempt = 0): void {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const settle = (): void => {
    if (attempt > 0 || reduced) return;
    const top = target.getBoundingClientRect().top;
    if (Math.abs(top - NAV_ANCHOR_OFFSET) > NAV_ANCHOR_TOLERANCE) {
      scrollToTarget(target, attempt + 1);
    }
  };
  if (instance !== null) {
    // lenis caches its scroll limit and only refreshes it from a
    // ResizeObserver callback, which runs after paint — on cross-route
    // navigations the limit can still describe the previous page, clamping
    // the flight to the old document's bottom. resize() refreshes it
    // synchronously (it also snaps a mid-flight animation to the current
    // position, which is what the next scrollTo should start from).
    instance.resize();
    instance.scrollTo(target, { duration: reduced ? 0 : 0.8, onComplete: settle });
  } else if (typeof target.scrollIntoView === "function") {
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }
}

/** Return to the top of the page — lenis when active, native otherwise. */
export function scrollToTop(): void {
  // Already at the top, the intent adds nothing the spy doesn't know —
  // and announcing it would hold an empty intent over the position spy
  // until the hand-back grace expires (breaks position-owned highlights
  // in tests and on a freshly loaded page).
  if (window.scrollY > 0) announce("");
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (instance !== null) {
    instance.resize();
    instance.scrollTo(0, { duration: reduced ? 0 : 0.7 });
  } else {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }
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
  // (and resets the scrollspy's hand-back grace) until the flight starts.
  announce(id);
  const target = document.getElementById(id);
  if (target !== null) {
    scrollToTarget(target);
    return;
  }
  if (attempt >= TARGET_WAIT_FRAMES) return;
  requestAnimationFrame(() => scrollToId(id, attempt + 1));
}
