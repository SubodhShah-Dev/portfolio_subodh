import Lenis from "lenis";

let instance: Lenis | null = null;
let frame = 0;

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

/** Scroll to a section target — lenis when active, native otherwise. */
export function scrollToTarget(target: HTMLElement): void {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (instance !== null) {
    instance.scrollTo(target, { offset: -72, duration: reduced ? 0 : 1.1 });
  } else if (typeof target.scrollIntoView === "function") {
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }
}
