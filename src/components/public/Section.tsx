import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  /** Intro copy supplied by the CMS — omitted when absent. */
  description?: string;
  /** Position among rendered sections — renders as a mono `01` eyebrow. */
  index?: number;
  children: ReactNode;
}

/**
 * Editorial homepage section (§7): hairline divider, mono number eyebrow,
 * and a display-serif heading. The number sits beside the heading (never
 * inside it) so the accessible name stays exactly `title`. Visibility is
 * decided by the caller from settings + actual content (§48).
 */
export function Section({ id, title, description, index, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-24 border-t border-ink/12 pt-10 lg:pt-14"
    >
      <div className="flex items-baseline gap-4">
        {index !== undefined && (
          <span className="eyebrow" aria-hidden="true">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <h2
          id={headingId}
          className="font-display text-3xl text-balance text-ink sm:text-4xl"
        >
          {title}
        </h2>
      </div>
      {description !== undefined && (
        <p className="mt-3 max-w-2xl text-base text-pretty text-ink/80">
          {description}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}
