import type { ReactNode } from "react";

interface TagProps {
  /** Fills the tag with the vermilion accent (featured marker). */
  accent?: boolean;
  children: ReactNode;
}

/**
 * Sharp mono tag for the public portfolio — replaces the rounded admin
 * Badge on public surfaces (featured marker, dates-adjacent labels).
 */
export function Tag({ accent = false, children }: TagProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center border px-2 py-0.5 font-meta text-[0.625rem] tracking-[0.12em] uppercase ${
        accent ? "border-accent bg-accent text-ink" : "border-ink/30 text-muted"
      }`}
    >
      {children}
    </span>
  );
}
