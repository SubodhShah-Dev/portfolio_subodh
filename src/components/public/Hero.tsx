import type { PortfolioProfile } from "../../types/profile";
import type { Resume } from "../../types/resume";

interface HeroProps {
  profile: PortfolioProfile;
  activeResume: Resume | null;
  contactVisible: boolean;
}

/** Identity hero — name, role, headline, and primary calls to action (§7). */
export function Hero({ profile, activeResume, contactVisible }: HeroProps) {
  const { name, role, headline, location } = profile.public;

  return (
    <header className="scroll-mt-24">
      {role.trim() !== "" && (
        <p className="text-sm font-medium tracking-widest text-emerald-400 uppercase">
          {role}
        </p>
      )}
      <h1 className="mt-3 text-4xl font-bold text-slate-100 sm:text-5xl">{name}</h1>
      {headline.trim() !== "" && (
        <p className="mt-4 max-w-2xl text-lg text-slate-400">{headline}</p>
      )}
      {location !== undefined && location.trim() !== "" && (
        <p className="mt-3 text-sm text-slate-500">Based in {location}</p>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        {activeResume !== null && (
          <a
            className="btn-primary"
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
          <a className="btn-secondary" href="#contact">
            Get in touch
          </a>
        )}
      </div>
    </header>
  );
}
