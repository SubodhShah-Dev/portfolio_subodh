import type { ReactNode } from "react";

interface TagProps {
  /** Fills the tag with signal (featured marker). */
  accent?: boolean;
  children: ReactNode;
}

/**
 * Sharp mono tag for the public portfolio — replaces the admin Badge on
 * public surfaces (featured marker, dates-adjacent labels).
 */
export function Tag({ accent = false, children }: TagProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border-2 border-ink px-2.5 py-0.5 font-meta text-[0.625rem] tracking-[0.12em] uppercase ${
        accent ? "bg-signal text-on-signal" : "text-ink"
      }`}
    >
      {children}
    </span>
  );
}
