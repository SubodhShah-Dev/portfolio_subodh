import { Fragment } from "react";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { SocialLinksList } from "./SocialLinksList";
import { scrollToTarget } from "../../utils/smoothScroll";
import type { PortfolioProfile } from "../../types/profile";
import type { SocialLink } from "../../types/socialLink";

interface HeroProps {
  profile: PortfolioProfile;
  contactVisible: boolean;
  socialLinks: SocialLink[];
}

/**
 * Identity hero — Pop Mono (§7): paper on paper with ink type — no color
 * band. Cobalt appears as the drawn rule and as the `</>` circle icon that
 * replaces the first "o" of the display name; decor is a bobbing terminal
 * pop-card (desktop only). The name lands in giant condensed Bricolage
 * revealed word-by-word behind overflow masks, with an aria-label keeping
 * the accessible name exactly the display name. The role sits under the top
 * row as plain display text — impactful, but clearly below the name. Social
 * links repeat the footer's pills (inverted for paper) at the right end of
 * the CTA row on desktop — below the stacked full-width CTAs on small
 * screens — and "Get in touch" follows the navbar's smooth anchor flight to
 * #contact. The resume download lives only in the header actions so the
 * composed page keeps a single instance.
 */
export function Hero({ profile, contactVisible, socialLinks }: HeroProps) {
  const { name, role, headline, location } = profile.public;

  const displayName = name.trim() !== "" ? name.trim() : "Portfolio";
  const words = displayName.split(/\s+/);
  const longest = words.reduce((max, word) => Math.max(max, word.length), 0);
  // Length-aware cap: longer names step down so they never overflow the
  // viewport at the giant masthead size.
  const nameSize =
    longest > 10
      ? "text-[clamp(2.75rem,8vw,7rem)]"
      : longest > 7
        ? "text-[clamp(3.25rem,10vw,9rem)]"
        : "text-[clamp(3.5rem,12vw,10.5rem)]";

  const hasTopRow =
    role.trim() !== "" || (location !== undefined && location.trim() !== "");

  // First "o"/"O" of the display name renders as the `</>` circle icon —
  // the h1's aria-label below keeps the accessible name the display name.
  const glyphWordIndex = words.findIndex((word) => /[oO]/.test(word));
  const glyphCharIndex =
    glyphWordIndex === -1 ? -1 : words[glyphWordIndex].search(/[oO]/);

  return (
    <header className="relative -mt-12 flex scroll-mt-24 flex-col justify-end overflow-hidden pt-14 pb-14 lg:-mt-16 lg:min-h-[78svh] lg:pt-24 lg:pb-20">
      {/* Developer decor — bobbing terminal card, desktop only. Pure
          decoration: aria-hidden, pointer-events-none, z-0 (content sits
          above at z-10). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[9%] right-[5%] z-0 hidden w-[19.5rem] xl:block"
      >
        <div className="animate-pop-bob">
          <div className="pop-card rotate-[2deg] p-4">
            <div className="flex items-center gap-1.5 border-b-2 border-ink pb-2.5">
              <span className="size-2.5 rounded-full bg-signal" />
              <span className="size-2.5 rounded-full border-2 border-ink" />
              <span className="size-2.5 rounded-full border-2 border-ink" />
              <span className="ml-auto font-meta text-[9px] tracking-[0.14em] text-muted uppercase">
                terminal
              </span>
            </div>
            <div className="mt-3 space-y-1.5 font-meta text-xs">
              <p className="text-muted">~/portfolio</p>
              <p className="text-ink">
                <span className="text-signal-deep">$</span> npm run dev
              </p>
              <p className="text-signal-deep">
                ➜ localhost:5173{" "}
                <span className="animate-pulse text-ink">▍</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 sm:px-6 lg:px-10">
        {hasTopRow && (
          <div
            className="animate-rise flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-meta text-[11px] tracking-[0.14em] uppercase"
            style={{ animationDelay: "0ms" }}
          >
            {role.trim() !== "" && (
              <span className="font-display text-[clamp(1.05rem,1.5vw,1.35rem)] font-semibold normal-case tracking-[-0.01em] text-ink">
                {role}
              </span>
            )}
            {location !== undefined && location.trim() !== "" && (
              <span className="text-muted">Based in {location}</span>
            )}
          </div>
        )}

        <h1
          aria-label={displayName}
          className={`mt-7 font-display ${nameSize} font-stretch-[85%] font-extrabold leading-[0.86] tracking-[-0.045em] text-ink`}
        >
          {words.map((word, index) => {
            const hasGlyph = index === glyphWordIndex;
            const before = hasGlyph ? word.slice(0, glyphCharIndex) : word;
            const after = hasGlyph ? word.slice(glyphCharIndex + 1) : "";
            return (
              <Fragment key={`${word}-${index}`}>
                {index > 0 && " "}
                <span className="inline-block overflow-hidden align-bottom">
                  <span
                    className="animate-word inline-block leading-[1.1]"
                    style={{ animationDelay: `${120 + index * 70}ms` }}
                  >
                    {before}
                    {hasGlyph && (
                      <span
                        aria-hidden="true"
                        className="mx-[0.03em] inline-flex size-[0.53em] items-center justify-center rounded-full bg-ink font-meta align-middle text-canvas shadow-[0.035em_0.035em_0_0_var(--color-signal)]"
                      >
                        <span className="text-[0.21em] leading-none font-bold">
                          {"</>"}
                        </span>
                      </span>
                    )}
                    {after}
                  </span>
                </span>
              </Fragment>
            );
          })}
        </h1>

        <div
          aria-hidden="true"
          className="animate-draw mt-9 h-1 w-full origin-left bg-signal"
          style={{ animationDelay: "400ms" }}
        />

        {headline.trim() !== "" && (
          <p
            className="animate-rise mt-7 max-w-[46ch] font-body text-[clamp(1.125rem,2vw,1.5rem)] leading-relaxed text-muted"
            style={{ animationDelay: "550ms" }}
          >
            {headline}
          </p>
        )}

        <div
          className="animate-rise mt-9 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
          style={{ animationDelay: "700ms" }}
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            {contactVisible && (
              <Link
                className="cta-primary group w-full sm:w-auto"
                to={{ pathname: "/", hash: "#contact" }}
                onClick={() => {
                  // Same anchor flight as the navbar's hash links: rAF lets
                  // the router commit first, then lenis takes over (the
                  // layout's hash effect covers hash changes; this covers
                  // re-clicks on the same hash).
                  requestAnimationFrame(() => {
                    const target = document.getElementById("contact");
                    if (target !== null) scrollToTarget(target);
                  });
                }}
              >
                Get in touch
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            )}
            <Link
              className="cta-ghost group w-full sm:w-auto"
              to="/projects"
              viewTransition
            >
              View my work
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {socialLinks.length > 0 && (
            <SocialLinksList links={socialLinks} tone="paper" />
          )}
        </div>
      </div>
    </header>
  );
}
