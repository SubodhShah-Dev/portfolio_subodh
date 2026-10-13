import type { SocialLink } from "../../types/socialLink";

interface SocialLinksListProps {
  links: SocialLink[];
  /** `band` for the black footer band; `paper` inverts the outline for light surfaces. */
  tone?: "band" | "paper";
}

/**
 * Social links row (§18) — icon-only anchors with an accessible label;
 * the platform SVG (iconUrl) is the whole affordance, sized to stay
 * noticeable. Band tone inverts the dark icons for the black footer;
 * paper tone keeps them ink and only inverts under dark mode.
 */
export function SocialLinksList({ links, tone = "band" }: SocialLinksListProps) {
  // Icon-only design — links without an icon asset would render blank.
  const visible = links.filter(
    (link) => link.iconUrl !== undefined && link.iconUrl.trim() !== "",
  );
  if (visible.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1">
      {visible.map((link) => {
        const label = link.label.trim() !== "" ? link.label : link.platform;
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex items-center justify-center rounded-full p-2 transition-transform duration-150 hover:-translate-y-0.5"
            >
              <img
                src={link.iconUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className={`size-6 ${tone === "band" ? "invert" : "dark:invert"}`}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
