import { Link } from "react-router";

import type { PortfolioProfile } from "../../types/profile";

interface HeroProps {
  profile: PortfolioProfile;
  contactVisible: boolean;
}

/** SVG fractal-noise grain — inlined so no network request is needed. */
const GRAIN_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

/**
 * Identity hero — full-width editorial treatment: glow + grain backdrop,
 * mono role eyebrow, display-serif name at a fluid clamp size, and the
 * primary calls to action (§7, §54). The resume download lives only in
 * the header actions so the composed page keeps a single instance.
 */
export function Hero({ profile, contactVisible }: HeroProps) {
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
        <p className="mt-5 font-meta text-sm text-slate-400">
          Based in {location}
        </p>
      )}

      <div className="mt-9 flex flex-wrap gap-4">
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
