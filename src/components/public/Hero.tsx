import { Fragment } from "react";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import type { PortfolioProfile } from "../../types/profile";

interface HeroProps {
  profile: PortfolioProfile;
  contactVisible: boolean;
}

/**
 * Identity hero — Signal × Pop cobalt band (§7): full-bleed signal block with
 * pop decor (bobbing lime circle, spinning star, stripes), a lime role
 * sticker, the name in giant condensed Bricolage revealed word-by-word
 * behind overflow masks, a drawn lime rule, then the calls to action. Word
 * wrappers keep real space text nodes so the accessible name stays exactly
 * the display name. The resume download lives only in the header actions so
 * the composed page keeps a single instance.
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
      ? "text-[clamp(2.75rem,8vw,7rem)]"
      : longest > 7
        ? "text-[clamp(3.25rem,10vw,9rem)]"
        : "text-[clamp(3.5rem,12vw,10.5rem)]";

  const hasTopRow =
    role.trim() !== "" || (location !== undefined && location.trim() !== "");

  return (
    <header className="bleed relative -mt-12 flex scroll-mt-24 flex-col justify-end overflow-hidden bg-signal pt-14 pb-14 text-on-signal lg:-mt-16 lg:min-h-[78svh] lg:pt-24 lg:pb-20">
      {/* Pop decor — desktop only, pure decoration. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="animate-pop-bob absolute top-[14%] right-[7%] hidden size-28 rounded-full border-2 border-on-accent bg-lime lg:block" />
        <div
          className="absolute top-[26%] right-[16%] hidden h-24 w-40 lg:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--color-on-signal) 0 4px, transparent 4px 14px)",
          }}
        />
        <svg
          viewBox="0 0 100 100"
          className="animate-spin-slow absolute right-[9%] bottom-[16%] hidden size-20 fill-pink stroke-on-accent lg:block"
          style={{ strokeWidth: 2 }}
        >
          <polygon points="50,3 61,38 98,38 68,60 79,95 50,73 21,95 32,60 2,38 39,38" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 sm:px-6 lg:px-10">
        {hasTopRow && (
          <div
            className="animate-rise flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-meta text-[11px] tracking-[0.14em] uppercase"
            style={{ animationDelay: "0ms" }}
          >
            {role.trim() !== "" && (
              <span className="rounded-full border-2 border-on-accent bg-lime px-3 py-1 text-on-accent">
                {role}
              </span>
            )}
            {location !== undefined && location.trim() !== "" && (
              <span className="text-on-signal/85">Based in {location}</span>
            )}
          </div>
        )}

        <h1
          className={`mt-7 font-display ${nameSize} font-stretch-[85%] font-extrabold leading-[0.86] tracking-[-0.045em] text-on-signal`}
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
          className="animate-draw mt-9 h-1 w-full origin-left bg-lime"
          style={{ animationDelay: "400ms" }}
        />

        {headline.trim() !== "" && (
          <p
            className="animate-rise mt-7 max-w-[46ch] font-body text-[clamp(1.125rem,2vw,1.5rem)] leading-relaxed text-on-signal/90"
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
            <a className="cta-primary group" href="#contact">
              Get in touch
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover:translate-x-1"
              />
            </a>
          )}
          <Link className="cta-ghost group" to="/projects" viewTransition>
            View my work
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
