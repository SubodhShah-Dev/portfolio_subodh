import { ArrowUpRight } from "lucide-react";

import type { SocialLink } from "../../types/socialLink";

interface SocialLinksListProps {
  links: SocialLink[];
}

/**
 * Social links row (§18) — outlined pop pills on the cobalt footer band;
 * label falls back to the platform name, external links always open safely
 * in a new tab, and each pill floods cobalt on hover.
 */
export function SocialLinksList({ links }: SocialLinksListProps) {
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2.5">
      {links.map((link) => {
        const label = link.label.trim() !== "" ? link.label : link.platform;
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border-2 border-band-ink px-4 py-2 font-meta text-[11px] tracking-[0.12em] text-band-ink uppercase transition-all duration-150 hover:-translate-y-0.5 hover:border-signal hover:bg-signal hover:text-on-signal"
            >
              {label}
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
