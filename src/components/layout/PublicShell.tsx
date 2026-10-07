import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";

export interface ShellLink {
  key: string;
  to: string | { pathname: string; hash?: string };
  label: string;
  /** Exact-match route highlighting (Home). */
  end?: boolean;
  /** Section id highlighted by the scrollspy while its section is in view. */
  spyId?: string;
}

interface PublicShellProps {
  /** Identity block — logo/name/role shown in the header. */
  brand: ReactNode;
  /** Header navigation (routes and section anchors). */
  links: ShellLink[];
  /** Compact header actions (e.g. resume download); also shown in the mobile menu. */
  actions?: ReactNode;
  /** Full footer content — rendered inside the shell's footer landmark. */
  footer: ReactNode;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function routeLinkClass(active: boolean): string {
  return [
    "rounded-md px-3 py-2 text-sm transition-colors duration-200",
    active
      ? "text-slate-50 underline decoration-2 decoration-emerald-400 underline-offset-[10px]"
      : "text-slate-400 hover:text-slate-100",
  ].join(" ");
}

function menuLinkClass(active: boolean): string {
  return [
    "block rounded-md px-3 py-2.5 text-sm transition-colors duration-200",
    active
      ? "bg-slate-800/60 text-emerald-400"
      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100",
  ].join(" ");
}

/**
 * Public site shell — sticky top navigation with scrollspy, non-modal mobile
 * menu, and a full-width footer (§7, §54, §55).
 *
 * Structure only: every piece of content arrives as props from PublicLayout,
 * which owns all loader data. Accessibility: skip link, single labelled
 * navigation landmark, Esc-to-close with focus restore on the menu button,
 * and reduced-motion-safe scrolling handled by the layout.
 */
export default function PublicShell({
  brand,
  links,
  actions,
  footer,
  children,
}: PublicShellProps) {
  const location = useLocation();

  // --- Mobile menu: derived from the navigation key so any route change
  // closes it during render (no setState-in-effect, same model as SidebarShell).
  const [openedAtKey, setOpenedAtKey] = useState<string | null>(null);
  const menuOpen = openedAtKey !== null && openedAtKey === location.key;
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wasOpen = useRef(false);

  // Move focus into the menu on open; restore it on close — but never on
  // initial page load (§54).
  useEffect(() => {
    if (menuOpen) {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  // Escape closes the menu while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpenedAtKey(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // --- Scrollspy: highlight the section link whose section currently owns
  // the upper part of the viewport. Disabled outside browsers without the API
  // (tests, very old engines) — the nav simply keeps route highlighting.
  const [activeSpyId, setActiveSpyId] = useState("");
  const spyKey = links.map((link) => link.spyId ?? "").join("|");
  useEffect(() => {
    if (spyKey === "" || typeof IntersectionObserver !== "function") return;

    const ids = spyKey.split("|").filter((id) => id !== "");
    const visible = new Map<string, boolean>();
    let lastActive = "";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting);
        }
        // Sections stack in DOM order — the first visible one owns the state.
        const active = ids.find((id) => visible.get(id) === true) ?? "";
        if (active !== lastActive) {
          lastActive = active;
          setActiveSpyId(active);
        }
      },
      { rootMargin: "-84px 0px -55% 0px", threshold: 0 },
    );

    for (const id of ids) {
      const element = document.getElementById(id);
      if (element !== null) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [spyKey, location.pathname]);

  const renderLink = (link: ShellLink, mobile: boolean): ReactNode => {
    const className = mobile ? menuLinkClass : routeLinkClass;
    if (link.spyId !== undefined) {
      const active = activeSpyId === link.spyId;
      return (
        <Link
          key={link.key}
          to={link.to}
          aria-current={active ? "true" : undefined}
          className={className(active)}
          onClick={() => setOpenedAtKey(null)}
        >
          {link.label}
        </Link>
      );
    }
    return (
      <NavLink
        key={link.key}
        to={link.to}
        end={link.end}
        className={({ isActive }) => {
          const active =
            isActive &&
            (!link.end || (location.hash === "" && activeSpyId === ""));
          return className(active);
        }}
        onClick={() => setOpenedAtKey(null)}
      >
        {link.label}
      </NavLink>
    );
  };

  const toggleMenu = (): void => {
    setOpenedAtKey(menuOpen ? null : location.key);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-body text-slate-400 antialiased">
      <a
        href="#main-content"
        className="sr-only z-100 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div className="min-w-0">{brand}</div>

          <nav
            aria-label="Site navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {links.map((link) => renderLink(link, false))}
          </nav>

          <div className="hidden lg:block">{actions}</div>

          <button
            ref={menuButtonRef}
            type="button"
            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-slate-100 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="public-menu"
            onClick={toggleMenu}
          >
            <span className="sr-only">
              {menuOpen ? "Close navigation menu" : "Open navigation menu"}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div
            ref={panelRef}
            id="public-menu"
            className="border-t border-slate-800/70 bg-slate-950/95 backdrop-blur-md lg:hidden"
          >
            <nav
              aria-label="Site navigation"
              className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6"
            >
              {links.map((link) => renderLink(link, true))}
              {actions !== undefined && (
                <div className="mt-3 border-t border-slate-800/70 pt-3">
                  {actions}
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-800/70">{footer}</footer>
    </div>
  );
}
