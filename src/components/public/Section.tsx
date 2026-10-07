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
 * Editorial homepage section (Signal): hairline divider, mono signal number
 * eyebrow, and a giant display heading. The number sits beside the heading
 * (never inside it) so the accessible name stays exactly `title`.
 * Visibility is decided by the caller from settings + actual content (§48).
 */
export function Section({ id, title, description, index, children }: SectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-24 border-t border-hairline pt-10 lg:pt-16"
    >
      <div className="flex items-baseline gap-4">
        {index !== undefined && (
          <span className="eyebrow" aria-hidden="true">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <h2
          id={headingId}
          className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em] text-balance text-ink"
        >
          {title}
        </h2>
      </div>
      {description !== undefined && (
        <p className="mt-4 max-w-2xl text-base text-pretty leading-relaxed text-muted">
          {description}
        </p>
      )}
      <div className="mt-8 lg:mt-10">{children}</div>
    </section>
  );
}
