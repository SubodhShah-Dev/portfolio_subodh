import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useRouteLoaderData } from "react-router";

import SidebarShell from "../components/layout/SidebarShell";
import { SocialLinksList } from "../components/public/SocialLinksList";
import type { PublicLayoutData } from "../loaders/publicLoaders";

/**
 * Public site layout — profile sidebar on every public route (§7).
 *
 * Section anchor links render only for sections that are both enabled and
 * actually have content (§48), so navigation never points at empty anchors.
 * All data comes from the shared layout route loader.
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

function navLinkClass(isActive: boolean): string {
  return [
    "mb-1 block rounded-lg border-l-2 px-3 py-2 text-sm transition-all duration-200",
    isActive
      ? "border-emerald-400 bg-slate-800/60 text-emerald-400"
      : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200",
  ].join(" ");
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
      <span className="block truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-emerald-400">
        {name.trim() !== "" ? name : "Portfolio"}
      </span>
      {role.trim() !== "" && (
        <span className="mt-0.5 block truncate text-xs text-slate-500">{role}</span>
      )}
    </Link>
  );

  const visibleSections = SECTION_LINKS.filter((section) => flags[section.flag]);

  const nav = (
    <>
      <NavLink
        to="/"
        end
        className={({ isActive }) => navLinkClass(isActive && location.hash === "")}
      >
        Home
      </NavLink>
      <NavLink to="/projects" className={({ isActive }) => navLinkClass(isActive)}>
        Work
      </NavLink>

      {visibleSections.length > 0 && (
        <>
          <p className="mt-5 mb-2 px-3 text-[11px] font-medium tracking-widest text-slate-600 uppercase">
            Sections
          </p>
          {visibleSections.map((section) => (
            <Link
              key={section.hash}
              to={{ pathname: "/", hash: section.hash }}
              className="mb-1 block rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800/40 hover:text-slate-200"
            >
              {section.label}
            </Link>
          ))}
        </>
      )}
    </>
  );

  const sidebarFooter =
    data.activeResume !== null || data.socialLinks.length > 0 ? (
      <div className="space-y-4">
        {data.activeResume !== null && (
          <a
            href={data.activeResume.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full justify-center"
          >
            Download resume
          </a>
        )}
        <SocialLinksList links={data.socialLinks} />
      </div>
    ) : undefined;

  const ownerName = profile?.public.name ?? "";
  const siteFooter = (
    <footer className="mt-16 border-t border-slate-800 pt-6 pb-2 text-xs text-slate-600">
      {data.footerText !== null && <p>{data.footerText}</p>}
      <p className={data.footerText !== null ? "mt-1" : ""}>
        © {new Date().getFullYear()}
        {ownerName.trim() !== "" ? ` ${ownerName}` : ""}
      </p>
    </footer>
  );

  return (
    <SidebarShell brand={brand} nav={nav} footer={sidebarFooter}>
      <Outlet />
      {siteFooter}
    </SidebarShell>
  );
}
