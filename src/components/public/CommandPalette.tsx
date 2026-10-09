import { Command } from "cmdk";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { scrollToId, scrollToTop } from "../../utils/smoothScroll";
import type { Theme } from "../../utils/theme";
import type { ShellLink } from "../layout/PublicShell";

interface CommandPaletteProps {
  links: ShellLink[];
  theme: Theme;
  onToggleTheme: () => void;
  onClose: () => void;
}

function linkToPath(to: ShellLink["to"]): string {
  return typeof to === "string" ? to : to.pathname + (to.hash ?? "");
}

/**
 * ⌘K palette — navigation shortcuts plus a theme command. Lazy-loaded from
 * the shell so cmdk never lands in the entry chunk; renders nothing until
 * opened, so tests and no-JS paths stay untouched.
 */
export default function CommandPalette({
  links,
  theme,
  onToggleTheme,
  onClose,
}: CommandPaletteProps) {
  const navigate = useNavigate();

  // Escape closes the palette — handled here so it does not depend on where
  // cmdk attaches its own listener.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <Command.Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      label="Command palette"
      className="fixed inset-0 z-100"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-[14vh] w-[calc(100vw-2rem)] max-w-lg border-2 border-ink bg-raised shadow-[12px_12px_0_0_var(--color-signal)]">
        <Command.Input
          placeholder="Type a command or search…"
          className="w-full bg-transparent px-4 py-3.5 text-base text-ink outline-none placeholder:text-muted"
        />
        <Command.List className="max-h-[50vh] overflow-y-auto border-t border-hairline p-2">
          <Command.Empty className="px-3 py-5 text-sm text-muted">
            No results.
          </Command.Empty>
          <Command.Group
            heading="Navigate"
            className="font-meta text-[10px] tracking-[0.14em] text-muted uppercase"
          >
            {links.map((link) => (
              <Command.Item
                key={link.key}
                value={link.label}
                onSelect={() => {
                  const path = linkToPath(link.to);
                  void navigate(path, { viewTransition: !path.includes("#") });
                  onClose();
                  // Mirror the nav links: same-location navigations never
                  // change the layout's scroll deps, so scroll explicitly.
                  if (path.includes("#")) {
                    scrollToId(path.slice(path.indexOf("#") + 1));
                  } else {
                    scrollToTop();
                  }
                }}
                className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm text-ink data-[highlighted]:bg-signal data-[highlighted]:text-on-signal"
              >
                {link.label}
                <span className="font-meta text-[10px] tracking-[0.1em] text-muted uppercase">
                  Go
                </span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group
            heading="Theme"
            className="font-meta text-[10px] tracking-[0.14em] text-muted uppercase"
          >
            <Command.Item
              value="Toggle light dark theme"
              onSelect={() => {
                onToggleTheme();
                onClose();
              }}
              className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm text-ink data-[highlighted]:bg-signal data-[highlighted]:text-on-signal"
            >
              Switch to {theme === "dark" ? "light" : "dark"} theme
              <span className="font-meta text-[10px] tracking-[0.1em] text-muted uppercase">
                ⇧⌘L
              </span>
            </Command.Item>
          </Command.Group>
        </Command.List>
        <div className="flex items-center justify-between border-t border-hairline px-3 py-2 font-meta text-[10px] tracking-[0.1em] text-muted uppercase">
          <span>↑↓ navigate</span>
          <span>esc close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
