import { useEffect } from "react";
import { Link, Outlet, useLocation, useRouteLoaderData } from "react-router";
import { Download } from "lucide-react";

import PublicShell, { type ShellLink } from "../components/layout/PublicShell";
import { SocialLinksList } from "../components/public/SocialLinksList";
import type { PublicLayoutData } from "../loaders/publicLoaders";
import { scrollToTarget } from "../utils/smoothScroll";
import { currentTheme } from "../utils/theme";

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

  // Scroll to the section target when arriving with a hash (incl. from other
  // routes) — routed through lenis when it is active.
  useEffect(() => {
    if (location.hash === "") return;
    const target = document.getElementById(location.hash.slice(1));
    if (target !== null) scrollToTarget(target);
  }, [location.hash, location.pathname]);

  // Reset scroll on plain route changes (no hash involved).
  useEffect(() => {
    if (location.hash === "") {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  // The no-FOUC bootstrap owns colorScheme on first paint; re-sync on mount
  // so returning from admin (which may pin dark) matches the chosen theme.
  useEffect(() => {
    document.documentElement.style.colorScheme = currentTheme();
  }, []);

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
      <div className="public-scope flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.02em] text-ink">
            Temporarily unavailable
          </h1>
          <p className="mt-3 text-sm text-muted">
            This site is currently paused. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  const name = profile?.public.name ?? "";
  const role = profile?.public.role ?? "";

  const brand = (
    <Link to="/" viewTransition className="group flex min-w-0 items-center gap-2.5">
      {data.logoUrl !== null && (
        <img src={data.logoUrl} alt="" className="h-6 w-auto shrink-0" />
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-lg font-extrabold tracking-[-0.03em] text-ink transition-colors group-hover:text-signal">
          {name.trim() !== "" ? name : "Portfolio"}
        </span>
        {role.trim() !== "" && (
          <span className="mt-0.5 block truncate font-meta text-[10px] tracking-[0.14em] text-muted uppercase">
            {role}
          </span>
        )}
      </span>
    </Link>
  );

  // Nav order mirrors homepage scroll order (§7): About…Certifications,
  // then Work (a route to /projects with a scrollspy id on the homepage's
  // #projects section — harmless when that section is hidden), then Contact.
  const visibleSections: ShellLink[] = SECTION_LINKS.filter(
    (section) => flags[section.flag],
  ).map((section) => ({
    key: section.hash,
    to: { pathname: "/", hash: section.hash },
    label: section.label,
    spyId: section.hash.slice(1),
  }));
  const workLink: ShellLink[] = [
    { key: "work", to: "/projects", label: "Work", spyId: "projects" },
  ];
  const contactIndex = visibleSections.findIndex(
    (section) => section.key === "#contact",
  );
  const orderedSections: ShellLink[] =
    contactIndex === -1
      ? [...visibleSections, ...workLink]
      : [
          ...visibleSections.slice(0, contactIndex),
          ...workLink,
          ...visibleSections.slice(contactIndex),
        ];
  const links: ShellLink[] = [
    { key: "home", to: "/", label: "Home", end: true },
    ...orderedSections,
  ];

  const actions =
    data.activeResume !== null ? (
      <a
        href={data.activeResume.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full justify-center lg:w-auto"
      >
        <Download aria-hidden="true" className="size-4" />
        Download resume
      </a>
    ) : undefined;

  // Footer email only when the contact section is actually enabled (§48).
  const contactEmail = flags.contact
    ? firstEmail(data.contactSettings?.email, profile?.contact.email)
    : null;
  const ownerName = profile?.public.name ?? "";

  const footer = (
    <div className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="eyebrow">Get in touch</p>
          <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-balance">
            Let&apos;s build something together.
          </h2>
          <div className="mt-8 flex flex-wrap gap-4">
            {contactEmail !== null && (
              <a className="cta-primary" href={`mailto:${contactEmail}`}>
                Say hello
              </a>
            )}
            <Link className="cta-ghost" to="/projects" viewTransition>
              See my work
            </Link>
          </div>
        </div>

        {data.socialLinks.length > 0 && (
          <div className="flex flex-col gap-4 lg:items-end">
            <p className="font-meta text-[11px] tracking-[0.14em] text-signal-soft uppercase">
              Find me on
            </p>
            <SocialLinksList links={data.socialLinks} />
          </div>
        )}
      </div>

      <div className="mt-16 flex flex-col gap-5 border-t border-band-muted/30 pt-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {data.footerText !== null && (
            <p className="font-meta text-xs text-band-muted">
              {data.footerText}
            </p>
          )}
          <p
            className={`font-meta text-[11px] tracking-[0.08em] text-band-muted uppercase ${
              data.footerText !== null ? "mt-1.5" : ""
            }`}
          >
            © {new Date().getFullYear()}
            {ownerName.trim() !== "" ? ` ${ownerName}` : ""}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <PublicShell brand={brand} links={links} actions={actions} footer={footer}>
      <Outlet />
    </PublicShell>
  );
}
