import type { SocialLink } from "../../types/socialLink";

interface SocialLinksListProps {
  links: SocialLink[];
}

/**
 * Social links row (§18) — renders in the footer; label falls back to the
 * platform name, and external links always open safely in a new tab.
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
              className="group inline-flex items-center gap-1.5 font-meta text-[11px] tracking-[0.12em] text-muted uppercase transition-colors hover:text-ink"
            >
              <span className="underline decoration-accent decoration-1 underline-offset-4 group-hover:decoration-2">
                {label}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              >
                <path d="M12.293 3.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414-1.414L14.586 9H4a1 1 0 1 1 0-2h10.586l-2.293-2.293a1 1 0 0 1 0-1.414Z" />
              </svg>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
