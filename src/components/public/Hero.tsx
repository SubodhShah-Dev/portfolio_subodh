import { Fragment } from "react";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import type { PortfolioProfile } from "../../types/profile";

interface HeroProps {
  profile: PortfolioProfile;
  contactVisible: boolean;
}

/**
 * Identity hero — Pop Mono (§7): paper on paper with ink type — no color
 * band. Cobalt appears only as the drawn rule; decor is developer-themed: a
 * bobbing terminal pop-card with a `</>` sticker badge (desktop only). The
 * name lands in giant condensed Bricolage revealed word-by-word behind
 * overflow masks. Word wrappers keep real space text nodes so the accessible
 * name stays exactly the display name. The resume download lives only in the
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
      ? "text-[clamp(2.75rem,8vw,7rem)]"
      : longest > 7
        ? "text-[clamp(3.25rem,10vw,9rem)]"
        : "text-[clamp(3.5rem,12vw,10.5rem)]";

  const hasTopRow =
    role.trim() !== "" || (location !== undefined && location.trim() !== "");

  return (
    <header className="relative -mt-12 flex scroll-mt-24 flex-col justify-end overflow-hidden pt-14 pb-14 lg:-mt-16 lg:min-h-[78svh] lg:pt-24 lg:pb-20">
      {/* Developer decor — terminal card + `</>` sticker, desktop only.
          Pure decoration: aria-hidden, pointer-events-none, z-0 (content
          sits above at z-10). */}
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
        <span className="absolute -bottom-7 -left-9 flex size-14 -rotate-6 items-center justify-center rounded-full bg-ink font-meta text-lg font-bold text-canvas shadow-[5px_5px_0_0_var(--color-signal)]">
          {"</>"}
        </span>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 sm:px-6 lg:px-10">
        {hasTopRow && (
          <div
            className="animate-rise flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-meta text-[11px] tracking-[0.14em] uppercase"
            style={{ animationDelay: "0ms" }}
          >
            {role.trim() !== "" && (
              <span className="rounded-full border-2 border-ink bg-raised px-3 py-1 text-ink">
                {role}
              </span>
            )}
            {location !== undefined && location.trim() !== "" && (
              <span className="text-muted">Based in {location}</span>
            )}
          </div>
        )}

        <h1
          className={`mt-7 font-display ${nameSize} font-stretch-[85%] font-extrabold leading-[0.86] tracking-[-0.045em] text-ink`}
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
