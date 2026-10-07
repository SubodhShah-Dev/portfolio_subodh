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
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {links.map((link) => {
        const label = link.label.trim() !== "" ? link.label : link.platform;
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-emerald-400"
            >
              {label}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-3"
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
