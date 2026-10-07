import { useEffect } from "react";
import { Link, Outlet, useLocation, useRouteLoaderData } from "react-router";

import PublicShell, { type ShellLink } from "../components/layout/PublicShell";
import { SocialLinksList } from "../components/public/SocialLinksList";
import type { PublicLayoutData } from "../loaders/publicLoaders";

/**
 * Public site layout — top-navigation shell around every public route (§7).
 *
 * Section anchor links render only for sections that are both enabled and
 * actually have content (§48), so navigation never points at empty anchors.
 * All data comes from the shared layout route loader; the shell owns only
 * presentation, including scrollspy highlighting of section links.
 */

const SECTION_LINKS: ReadonlyArray<{
  hash: string;
  label: string;
  flag: keyof PublicLayoutData["flags"];
}> = [
  { hash: "#about", label: "About", flag: "about" },
  { hash: "#skills", label: "Skills", flag: "skills" },
  { hash: "#experience", label: "Experience", flag: "experience" },
  { hash: "#education", label: "Education", flag: "education" },
  { hash: "#certifications", label: "Certifications", flag: "certifications" },
  { hash: "#contact", label: "Contact", flag: "contact" },
];

/** First non-blank candidate — footer email falls back across sources. */
function firstEmail(...candidates: (string | undefined)[]): string | null {
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate.trim() !== "") return candidate;
  }
  return null;
}

export default function PublicLayout() {
  const data = useRouteLoaderData("public") as PublicLayoutData;
  const location = useLocation();
  const { profile, flags } = data;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll to the section target when arriving with a hash (incl. from other routes).
  useEffect(() => {
    if (location.hash === "") return;
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [location.hash, location.pathname, reducedMotion]);

  // Reset scroll on plain route changes (no hash involved).
  useEffect(() => {
    if (location.hash === "") {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  // Document metadata from site settings, with honest fallbacks (§47).
  useEffect(() => {
    const ownerName = profile?.public.name ?? "";
    document.title =
      data.siteTitle ?? (ownerName.trim() !== "" ? ownerName : "Portfolio");
  }, [data.siteTitle, profile]);

  useEffect(() => {
    const url = data.faviconUrl;
    if (url === null) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    let created = false;
    if (link === null) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
      created = true;
    }
    link.href = url;
    return () => {
      if (created) link?.remove();
      else link?.removeAttribute("href");
    };
  }, [data.faviconUrl]);

  if (!data.siteEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-100">
            Temporarily unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            This site is currently paused. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  const name = profile?.public.name ?? "";
  const role = profile?.public.role ?? "";

  const brand = (
    <Link to="/" className="group block min-w-0">
      {data.logoUrl !== null && (
        <img src={data.logoUrl} alt="" className="mb-2 h-7 w-auto" />
      )}
      <span className="block truncate font-display text-lg font-semibold text-slate-100 transition-colors group-hover:text-emerald-400">
        {name.trim() !== "" ? name : "Portfolio"}
      </span>
      {role.trim() !== "" && (
        <span className="mt-0.5 block truncate font-meta text-[11px] tracking-wider text-slate-500 uppercase">
          {role}
        </span>
      )}
    </Link>
  );

  const visibleSections = SECTION_LINKS.filter((section) => flags[section.flag]);
  const links: ShellLink[] = [
    { key: "home", to: "/", label: "Home", end: true },
    { key: "work", to: "/projects", label: "Work" },
    ...visibleSections.map((section) => ({
      key: section.hash,
      to: { pathname: "/", hash: section.hash },
      label: section.label,
      spyId: section.hash.slice(1),
    })),
  ];

  const actions =
    data.activeResume !== null ? (
      <a
        href={data.activeResume.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary w-full justify-center lg:w-auto"
      >
        Download resume
      </a>
    ) : undefined;

  // Footer email only when the contact section is actually enabled (§48).
  const contactEmail = flags.contact
    ? firstEmail(data.contactSettings?.email, profile?.contact.email)
    : null;
  const ownerName = profile?.public.name ?? "";

  const footer = (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Get in touch</p>
        <h2 className="mt-4 font-display text-3xl font-semibold text-balance text-slate-100 sm:text-4xl">
          Let&apos;s build something together.
        </h2>
        {contactEmail !== null && (
          <a
            href={`mailto:${contactEmail}`}
            className="mt-5 inline-block font-meta text-sm break-all text-emerald-400 underline-offset-4 hover:underline sm:text-base"
          >
            {contactEmail}
          </a>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          {contactEmail !== null && (
            <a className="cta-primary" href={`mailto:${contactEmail}`}>
              Say hello
            </a>
          )}
          <Link className="cta-ghost" to="/projects">
            See my work
          </Link>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-4 border-t border-slate-800/70 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {data.footerText !== null && (
            <p className="text-sm text-slate-500">{data.footerText}</p>
          )}
          <p
            className={`text-xs text-slate-600 ${
              data.footerText !== null ? "mt-1" : ""
            }`}
          >
            © {new Date().getFullYear()}
            {ownerName.trim() !== "" ? ` ${ownerName}` : ""}
          </p>
        </div>
        <SocialLinksList links={data.socialLinks} />
      </div>
    </div>
  );

  return (
    <PublicShell brand={brand} links={links} actions={actions} footer={footer}>
      <Outlet />
    </PublicShell>
  );
}
