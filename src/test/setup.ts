import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// React Testing Library only auto-registers cleanup when Vitest globals are
// enabled; this project imports describe/it/expect explicitly instead.
afterEach(() => {
  cleanup();
});

// --- jsdom shims for browser APIs used by layouts/scroll behavior ----------

if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom's scrollTo emits "not implemented" noise; silence it with a no-op.
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

if (typeof Element.prototype.scrollIntoView !== "function") {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    writable: true,
    value: () => {},
  });
}

// cmdk (⌘K palette) measures its dialog with ResizeObserver; jsdom has none.
if (typeof window.ResizeObserver !== "function") {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: ResizeObserverStub,
  });
}
