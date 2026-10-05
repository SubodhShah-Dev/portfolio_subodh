import { useEffect } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router";

import SidebarShell from "../components/layout/SidebarShell";

/**
 * Public site layout — profile sidebar on every public route (§7).
 *
 * Navigation is structural: real section visibility and profile data are
 * wired in Phase 8 from Firestore. Section anchor links only render for
 * enabled sections with content — never pointing at missing content.
 */

const sectionLinks: ReadonlyArray<{ hash: string; label: string }> = [
  { hash: "#about", label: "About" },
  { hash: "#skills", label: "Skills" },
  { hash: "#experience", label: "Experience" },
  { hash: "#education", label: "Education" },
  { hash: "#certifications", label: "Certifications" },
  { hash: "#contact", label: "Contact" },
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
  const location = useLocation();
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

  const brand = (
    <Link to="/" className="block group">
      {/* Profile identity (name/role) is loaded from Firestore in Phase 8 —
          skeletons until real values exist; nothing is invented. */}
      <div className="space-y-2" aria-hidden="true">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
        <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
      </div>
      <span className="sr-only">Portfolio home</span>
    </Link>
  );

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

      <p className="mt-5 mb-2 px-3 text-[11px] font-medium tracking-widest text-slate-600 uppercase">
        Sections
      </p>
      {sectionLinks.map((section) => (
        <Link
          key={section.hash}
          to={{ pathname: "/", hash: section.hash }}
          className="mb-1 block rounded-lg border-l-2 border-transparent px-3 py-2 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800/40 hover:text-slate-200"
        >
          {section.label}
        </Link>
      ))}
    </>
  );

  return (
    <SidebarShell brand={brand} nav={nav}>
      <Outlet />
    </SidebarShell>
  );
}
