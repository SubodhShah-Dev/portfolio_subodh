import { Fragment } from "react";
import { Link } from "react-router";

import type { PortfolioProfile } from "../../types/profile";

interface HeroProps {
  profile: PortfolioProfile;
  contactVisible: boolean;
}

/**
 * Identity hero — ink-on-paper masthead (§7): a running head with role and
 * location, the name in giant Instrument Serif revealed word-by-word behind
 * overflow masks, a drawn rule, the serif-italic deck, then the calls to
 * action. Word wrappers keep real space text nodes so the accessible name
 * stays exactly `Ada Lovelace`. The resume download lives only in the
 * header actions so the composed page keeps a single instance.
 */
export function Hero({ profile, contactVisible }: HeroProps) {
  const { name, role, headline, location } = profile.public;

  const displayName = name.trim() !== "" ? name.trim() : "Portfolio";
  const words = displayName.split(/\s+/);
  const longest = words.reduce((max, word) => Math.max(max, word.length), 0);
  // Length-aware cap: longer names step down so they never overflow the
  // viewport at the giant masthead size.
  const nameSize =
    longest > 10
      ? "text-[clamp(2.5rem,7vw,6rem)]"
      : longest > 7
        ? "text-[clamp(3rem,9vw,8rem)]"
        : "text-[clamp(3.25rem,11vw,9.5rem)]";

  const hasTopRow =
    role.trim() !== "" || (location !== undefined && location.trim() !== "");

  return (
    <header className="relative flex scroll-mt-24 flex-col justify-end pt-16 pb-14 lg:min-h-[76svh] lg:pt-24 lg:pb-20">
      {hasTopRow && (
        <div
          className="animate-rise flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-meta text-[11px] tracking-[0.14em] uppercase"
          style={{ animationDelay: "0ms" }}
        >
          {role.trim() !== "" && <span className="text-accent-deep">{role}</span>}
          {location !== undefined && location.trim() !== "" && (
            <span className="text-muted">Based in {location}</span>
          )}
        </div>
      )}

      <h1
        className={`mt-6 font-display ${nameSize} leading-[0.95] tracking-[-0.03em] text-ink`}
      >
        {words.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            {index > 0 && " "}
            <span className="inline-block overflow-hidden align-bottom">
              <span
                className="animate-word inline-block leading-[1.1]"
                style={{ animationDelay: `${120 + index * 70}ms` }}
              >
                {word}
              </span>
            </span>
          </Fragment>
        ))}
      </h1>

      <div
        aria-hidden="true"
        className="animate-draw mt-8 h-0.5 w-full origin-left bg-ink"
        style={{ animationDelay: "400ms" }}
      />

      {headline.trim() !== "" && (
        <p
          className="animate-rise mt-7 max-w-[46ch] font-display text-[clamp(1.125rem,2vw,1.5rem)] leading-snug text-ink/80 italic"
          style={{ animationDelay: "550ms" }}
        >
          {headline}
        </p>
      )}

      <div
        className="animate-rise mt-9 flex flex-wrap gap-4"
        style={{ animationDelay: "700ms" }}
      >
        {contactVisible && (
          <a className="cta-primary" href="#contact">
            Get in touch
          </a>
        )}
        <Link className="cta-ghost" to="/projects">
          View my work
        </Link>
      </div>
    </header>
  );
}
