import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scroll-reveal wrapper (§54).
 *
 * Content renders visible by default; only where IntersectionObserver
 * exists does the effect add the hidden `.reveal` class and flip it on
 * first intersection — so no-JS-API environments and tests always show
 * content, and prefers-reduced-motion users get it without transition
 * (global media rule zeroes transition durations).
 */
export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof IntersectionObserver !== "function") return;

    // Already on screen at mount — never hide, never animate.
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) return;

    element.classList.add("reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry === undefined || !entry.isIntersecting) return;
        element.classList.add("reveal-in");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.08 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
