import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  /** Intro copy supplied by the CMS — omitted when absent. */
  description?: string;
  children: ReactNode;
}

/**
 * Standard homepage section with an anchor id and labelled heading (§7).
 * Visibility is decided by the caller from settings + actual content (§48).
 */
export function Section({ id, title, description, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24">
      <h2 id={headingId} className="text-xl font-semibold text-slate-100">
        {title}
      </h2>
      {description !== undefined && (
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
