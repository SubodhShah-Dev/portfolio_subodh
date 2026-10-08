import { ArrowUpRight } from "lucide-react";

import type { SocialLink } from "../../types/socialLink";

interface SocialLinksListProps {
  links: SocialLink[];
}

/**
 * Social links row (§18) — renders in the footer band; label falls back to
 * the platform name, and external links always open safely in a new tab.
 */
export function SocialLinksList({ links }: SocialLinksListProps) {
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-3">
      {links.map((link) => {
        const label = link.label.trim() !== "" ? link.label : link.platform;
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 font-meta text-[11px] tracking-[0.12em] text-band-muted uppercase transition-colors hover:text-band-ink"
            >
              <span className="underline decoration-signal-soft decoration-1 underline-offset-4 group-hover:decoration-2">
                {label}
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
