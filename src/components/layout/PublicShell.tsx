import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Menu, Moon, Search, Sun, X } from "lucide-react";

import {
  initLenis,
  NAV_ANCHOR_OFFSET,
  NAV_ANCHOR_TOLERANCE,
  scrollToId,
  scrollToTop,
} from "../../utils/smoothScroll";
import { currentTheme, toggleTheme, type Theme } from "../../utils/theme";

const CommandPalette = lazy(() => import("../public/CommandPalette"));

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
    "relative rounded-full px-3.5 py-2 font-meta text-[11px] tracking-[0.12em] uppercase transition-colors duration-200",
    // The pill behind the active link flips with ink (black in light, white
    // in dark), so its label flips too — text-canvas on the ink pill.
    active ? "text-canvas" : "text-muted hover:text-ink",
  ].join(" ");
}

function menuLinkClass(active: boolean): string {
  return [
    "block rounded-lg px-3 py-2.5 font-meta text-[11px] tracking-[0.12em] uppercase transition-colors duration-200",
    active
      ? "bg-ink text-canvas"
      : "text-muted hover:bg-ink/5 hover:text-ink",
  ].join(" ");
}

/**
 * Public site shell — sticky top navigation with scrollspy, non-modal mobile
 * menu, theme toggle, ⌘K palette, reading progress, and an inverted footer
 * band (§7, §54, §55).
 *
 * Structure only: every piece of content arrives as props from PublicLayout,
 * which owns all loader data. Accessibility: skip link, single labelled
 * navigation landmark, Esc-to-close with focus restore on the menu button,
 * and lenis kept off under reduced motion and in tests.
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

  // --- Smooth scrolling: mounted once for the public site, skipped in tests
  // and whenever the visitor prefers reduced motion.
  useEffect(() => {
    if (import.meta.env.MODE === "test") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return initLenis();
  }, []);

  // --- Command palette: ⌘K / Ctrl+K toggles the lazy-loaded palette.
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Theme: the document state is the source of truth (bootstrap script +
  // applyTheme); this mirror only feeds the toggle icon swap.
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const handleToggleTheme = (): void => {
    setTheme(toggleTheme());
  };
  const themeLabel =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  // --- Scrollspy: the LAST spy section whose top has crossed the sticky
  // header band (scroll-mt-24's 96px + the settle tolerance shared with
  // scrollToTarget) owns the highlight, so reaching the footer keeps Contact lit instead of
  // falling back to Home, and the top of the page always falls back to Home.
  // rAF-throttled like the progress bar; state only updates inside the rAF
  // callback (no setState-in-effect). The state records the pathname that
  // produced it, so a route change DERIVES an empty highlight: sections that
  // don't exist on the new page can never stay aria-current.
  const [spyState, setSpyState] = useState({ pathname: "", id: "" });
  const activeSpyId =
    spyState.pathname === location.pathname ? spyState.id : "";
  const spyKey = links.map((link) => link.spyId ?? "").join("|");
  useEffect(() => {
    if (spyKey === "") return;

    const ids = spyKey.split("|").filter((id) => id !== "");
    const SPY_OFFSET = NAV_ANCHOR_OFFSET + NAV_ANCHOR_TOLERANCE;
    let frame = 0;

    const update = (): void => {
      frame = 0;
      let active = "";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (
          element !== null &&
          element.getBoundingClientRect().top <= SPY_OFFSET
        ) {
          active = id;
        }
      }
      setSpyState((prev) =>
        prev.pathname === location.pathname && prev.id === active
          ? prev
          : { pathname: location.pathname, id: active },
      );
    };
    const requestUpdate = (): void => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [spyKey, location.pathname]);

  // --- Back-to-top: appears once the visitor is past the fold. Threshold
  // state only flips twice, so scrolling stays cheap.
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = (): void => {
      setShowBackToTop(window.scrollY > 640);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Reading progress: a 2px signal bar riding the header's bottom rule.
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
    const linkClass = mobile ? menuLinkClass : routeLinkClass;
    const underline = (active: boolean): ReactNode =>
      !mobile && active ? (
        <motion.span
          layoutId="nav-pill"
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-ink"
          transition={{ type: "spring", stiffness: 460, damping: 36 }}
        />
      ) : null;

    // Route matching (replaces NavLink's): exact for `end`, prefix otherwise
    // so /projects/:id keeps Work lit. Hash sections ignore the route —
    // their pathname is always "/" — and are governed by the scrollspy.
    const isHashLink = typeof link.to === "object" && link.to.hash !== undefined;
    const linkPathname = typeof link.to === "string" ? link.to : link.to.pathname;
    const routeActive = link.end
      ? location.pathname === linkPathname
      : location.pathname === linkPathname ||
        (linkPathname !== "/" &&
          location.pathname.startsWith(`${linkPathname}/`));
    const active =
      link.spyId !== undefined
        ? isHashLink
          ? activeSpyId === link.spyId
          : routeActive || activeSpyId === link.spyId
        : routeActive && activeSpyId === "";

    return (
      <Link
        key={link.key}
        to={link.to}
        viewTransition={!isHashLink}
        aria-current={active ? "true" : undefined}
        className={linkClass(active)}
        onClick={() => {
          setOpenedAtKey(null);
          if (
            typeof link.to === "object" &&
            link.to.hash !== undefined &&
            link.to.hash.length > 1
          ) {
            // Waits for the anchor to mount on cross-route arrivals, then
            // flies; same-hash re-clicks find it on the first frame.
            scrollToId(link.to.hash.slice(1));
          } else {
            // Route links: navigating to the SAME location leaves the
            // layout's reset effect without a dep change (Home at /, Work
            // at /projects), so the click would do nothing while scrolled.
            // Scroll here too — the effect covers cross-route clicks with
            // the same harmless double call.
            requestAnimationFrame(() => scrollToTop());
          }
        }}
      >
        {link.label}
        {underline(active)}
      </Link>
    );
  };

  const toggleMenu = (): void => {
    setOpenedAtKey(menuOpen ? null : location.key);
  };

  return (
    <div className="public-scope flex min-h-screen flex-col bg-canvas font-body text-ink antialiased">
      <a
        href="#main-content"
        className="sr-only z-100 bg-ink px-4 py-2 text-sm font-medium text-canvas focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Fixed dot-grid texture — sits UNDER page content (z-0), so opaque
          bands and cards hide it while the open canvas shows it. */}
      <div
        aria-hidden="true"
        className="grid-overlay pointer-events-none fixed inset-0 z-0"
      />

      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-16 lg:px-10">
          <div className="min-w-0 shrink">{brand}</div>

          <nav
            aria-label="Site navigation"
            className="hidden items-center gap-0.5 lg:flex"
          >
            {links.map((link) => renderLink(link, false))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              {actions}
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
                className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-ink px-3 py-1.5 text-ink transition-colors hover:bg-ink hover:text-canvas"
              >
                <Search aria-hidden="true" className="size-3.5" />
                <span className="font-meta text-[10px] tracking-[0.1em] uppercase">
                  Search
                </span>
                <kbd className="rounded border border-current px-1 font-meta text-[10px]">
                  ⌘K
                </kbd>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
              className="relative flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-ink text-ink transition-colors hover:bg-ink hover:text-canvas"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center"
                >
                  {theme === "dark" ? (
                    <Sun aria-hidden="true" className="size-[18px]" />
                  ) : (
                    <Moon aria-hidden="true" className="size-[18px]" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-ink text-ink transition-colors hover:bg-ink hover:text-canvas lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="public-menu"
              onClick={toggleMenu}
            >
              <span className="sr-only">
                {menuOpen ? "Close navigation menu" : "Open navigation menu"}
              </span>
              {menuOpen ? (
                <X aria-hidden="true" className="size-[18px]" />
              ) : (
                <Menu aria-hidden="true" className="size-[18px]" />
              )}
            </button>
          </div>
        </div>

        <div
          aria-hidden="true"
          ref={progressRef}
          className="pointer-events-none absolute -bottom-px left-0 h-0.5 w-full origin-left bg-signal"
          style={{ transform: "scaleX(0)" }}
        />

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={panelRef}
              id="public-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-hairline bg-canvas lg:hidden"
            >
              <nav
                aria-label="Site navigation"
                className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6"
              >
                {links.map((link, index) => (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.03 * index,
                      duration: 0.18,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {renderLink(link, true)}
                  </motion.div>
                ))}
                {actions !== undefined && (
                  <div className="mt-3 border-t border-hairline pt-3">
                    {actions}
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 flex-1 outline-none"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          {children}
        </div>
      </main>

      <footer className="band relative z-10 bg-band text-band-ink">{footer}</footer>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            key="back-to-top"
            type="button"
            aria-label="Back to top"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-4 bottom-4 z-60 flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-signal text-on-signal shadow-pop transition-transform hover:-translate-y-0.5"
          >
            <ArrowUp aria-hidden="true" className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            links={links}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onClose={() => setPaletteOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
