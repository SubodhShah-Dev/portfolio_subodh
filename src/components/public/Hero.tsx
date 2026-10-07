import type { PortfolioProfile } from "../../types/profile";
import type { Resume } from "../../types/resume";

interface HeroProps {
  profile: PortfolioProfile;
  activeResume: Resume | null;
  contactVisible: boolean;
}

/** SVG fractal-noise grain — inlined so no network request is needed. */
const GRAIN_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * Identity hero — full-width editorial treatment: glow + grain backdrop,
 * mono role eyebrow, display-serif name at a fluid clamp size, and the
 * primary calls to action (§7, §54).
 */
export function Hero({ profile, activeResume, contactVisible }: HeroProps) {
  const { name, role, headline, location } = profile.public;

  return (
    <header className="hero-enter relative scroll-mt-24 overflow-hidden pt-6 pb-2 lg:pt-10">
      {/* Ambient emerald glow + film grain behind the type. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[820px] max-w-[140vw] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: `url("${GRAIN_URL}")`, backgroundRepeat: "repeat" }}
        />
      </div>

      {role.trim() !== "" && <p className="eyebrow">{role}</p>}

      <h1 className="mt-5 font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98] font-semibold tracking-tight text-slate-50">
        {name}
      </h1>

      {headline.trim() !== "" && (
        <p className="mt-6 max-w-2xl text-xl text-pretty text-slate-400 sm:text-2xl">
          {headline}
        </p>
      )}

      {location !== undefined && location.trim() !== "" && (
        <p className="mt-5 font-meta text-sm text-slate-500">
          Based in {location}
        </p>
      )}

      <div className="mt-9 flex flex-wrap gap-4">
        {activeResume !== null && (
          <a
            className="cta-primary"
            href={activeResume.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download resume
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
            >
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.619L6.22 8.03a.75.75 0 0 0-1.06 1.06l4.5 4.5a.75.75 0 0 0 1.06 0l4.5-4.5a.75.75 0 1 0-1.06-1.06l-3.03 3.34V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5a2.75 2.75 0 0 0 2.75-2.75v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
          </a>
        )}
        {contactVisible && (
          <a className="cta-ghost" href="#contact">
            Get in touch
          </a>
        )}
      </div>
    </header>
  );
}
