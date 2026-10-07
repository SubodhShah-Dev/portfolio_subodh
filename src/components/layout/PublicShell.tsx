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
    "px-3 py-2 font-meta text-[11px] tracking-[0.12em] uppercase transition-colors duration-200",
    active
      ? "text-ink underline decoration-2 decoration-accent underline-offset-[6px]"
      : "text-muted hover:text-ink",
  ].join(" ");
}

function menuLinkClass(active: boolean): string {
  return [
    "block px-3 py-2.5 font-meta text-[11px] tracking-[0.12em] uppercase transition-colors duration-200",
    active
      ? "bg-ink/8 text-accent-deep"
      : "text-muted hover:bg-ink/5 hover:text-ink",
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

  // --- Reading progress: a 2px accent bar riding the header's bottom rule.
  // Writes the transform directly from a rAF-throttled scroll listener — no
  // state, so scrolling never re-renders the shell (§54).
  const progressRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let frame = 0;
    const update = (): void => {
      frame = 0;
      const bar = progressRef.current;
      if (bar === null) return;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    };
    const requestUpdate = (): void => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

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
    <div className="flex min-h-screen flex-col bg-paper font-body text-ink/80 antialiased">
      <a
        href="#main-content"
        className="sr-only z-100 bg-ink px-4 py-2 text-sm font-medium text-paper focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Fixed paper fiber over the whole viewport (§56). */}
      <div
        aria-hidden="true"
        className="paper-grain pointer-events-none fixed inset-0 z-50 opacity-[0.045] mix-blend-multiply"
      />

      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-16 lg:px-10">
          <div className="min-w-0">{brand}</div>

          <nav
            aria-label="Site navigation"
            className="hidden items-center gap-0.5 lg:flex"
          >
            {links.map((link) => renderLink(link, false))}
          </nav>

          <div className="hidden lg:block">{actions}</div>

          <button
            ref={menuButtonRef}
            type="button"
            className="border border-ink/30 p-2 text-ink transition-colors hover:border-accent hover:text-ink lg:hidden"
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

        <div
          aria-hidden="true"
          ref={progressRef}
          className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-full origin-left bg-accent"
          style={{ transform: "scaleX(0)" }}
        />

        {menuOpen && (
          <div
            ref={panelRef}
            id="public-menu"
            className="border-t-2 border-ink bg-paper lg:hidden"
          >
            <nav
              aria-label="Site navigation"
              className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6"
            >
              {links.map((link) => renderLink(link, true))}
              {actions !== undefined && (
                <div className="mt-3 border-t border-ink/12 pt-3">
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

      <footer className="border-t-2 border-ink">{footer}</footer>
    </div>
  );
}
