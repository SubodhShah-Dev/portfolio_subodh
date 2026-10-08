import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { Menu, X } from "lucide-react";

interface SidebarShellProps {
  /** Sidebar identity block — rendered in the sidebar and (compact) mobile bar. */
  brand: ReactNode;
  /** Navigation content (links). Rendered in the sidebar and mobile drawer. */
  nav: ReactNode;
  /** Optional sidebar footer (resume CTA, social links). */
  footer?: ReactNode;
  /** Main page content. */
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Responsive sidebar shell for the admin CMS (§55).
 *
 * - ≥lg: fixed 256px sidebar, content offset to the right.
 * - <lg: sticky top bar + focus-trapped slide-in drawer (same nav model —
 *   never a second navigation structure).
 * - Skip link, aria-current support via NavLink, Esc-to-close, focus restore.
 */
export default function SidebarShell({ brand, nav, footer, children }: SidebarShellProps) {
  const location = useLocation();
  // Drawer visibility is derived from the navigation key: any route change
  // (link click, Back/Forward) closes it during render — no setState-in-effect.
  const [openedAtKey, setOpenedAtKey] = useState<string | null>(null);
  const drawerOpen = openedAtKey !== null && openedAtKey === location.key;
  const drawerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  // On open: move focus into the drawer. On close: restore focus to the
  // menu button — but never on initial page load (§54).
  useEffect(() => {
    if (drawerOpen) {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [drawerOpen]);

  // Esc closes; Tab is trapped inside the drawer while open.
  useEffect(() => {
    if (!drawerOpen) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpenedAtKey(null);
        return;
      }
      if (event.key !== "Tab" || drawerRef.current === null) return;

      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  const sidebarBody = (
    <>
      <nav aria-label="Site navigation" className="flex-1 overflow-y-auto px-3 py-4">
        {nav}
      </nav>
      {footer !== undefined && (
        <div className="border-t border-slate-800 px-4 py-4">{footer}</div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <a
        href="#main-content"
        className="sr-only z-100 bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0">{brand}</div>
        <button
          ref={menuButtonRef}
          type="button"
          className="border border-slate-700 p-2 text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-slate-100"
          aria-expanded={drawerOpen}
          aria-controls="sidebar-drawer"
          onClick={() => setOpenedAtKey(location.key)}
        >
          <span className="sr-only">Open navigation menu</span>
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside
        aria-label="Sidebar"
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-slate-900/60 lg:flex"
      >
        <div className="border-b border-slate-800 px-5 py-5">{brand}</div>
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setOpenedAtKey(null)}
          />
          <aside
            id="sidebar-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="min-w-0">{brand}</div>
              <button
                type="button"
                className="border border-slate-700 p-2 text-slate-300 hover:border-emerald-500/50 hover:text-slate-100"
                onClick={() => setOpenedAtKey(null)}
              >
                <span className="sr-only">Close navigation menu</span>
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      )}

      <main id="main-content" className="min-h-screen lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
