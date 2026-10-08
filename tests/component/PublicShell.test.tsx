import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PublicLayout from "../../src/layouts/PublicLayout";
import { HIDDEN_FLAGS, makeLayoutData, makeProfile } from "../fixtures/publicContent";

function renderShell() {
  const data = makeLayoutData({
    profile: makeProfile(),
    flags: { ...HIDDEN_FLAGS, about: true, contact: true },
    activeResume: {
      id: "r1",
      source: "external",
      downloadUrl: "https://example.com/resume.pdf",
      isActive: true,
      updatedAt: Timestamp.now(),
    },
  });
  const router = createMemoryRouter(
    [
      {
        id: "public",
        path: "/",
        loader: () => Promise.resolve(data),
        element: <PublicLayout />,
        children: [{ index: true, element: <p>Page content</p> }],
      },
    ],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("PublicShell interactions", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
  });

  it("toggles the document theme from the header button", async () => {
    renderShell();

    const toggle = await screen.findByRole("button", {
      name: "Switch to dark theme",
    });
    fireEvent.click(toggle);

    expect(document.documentElement.classList).toContain("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(document.documentElement.classList).not.toContain("dark");
  });

  it("opens the command palette with Ctrl+K and closes it with Escape", async () => {
    renderShell();
    await screen.findAllByText("Ada Lovelace");

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const input = await screen.findByPlaceholderText("Type a command or search…");
    expect(input).toBeTruthy();
    expect(screen.getByText("Navigate")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Type a command or search…")).toBeNull();
  });

  it("opens the mobile menu and reveals its links and actions", async () => {
    renderShell();

    const menuButton = await screen.findByRole("button", {
      name: "Open navigation menu",
    });
    fireEvent.click(menuButton);

    expect(document.getElementById("public-menu")).not.toBeNull();
    expect(
      document.getElementById("public-menu"),
    ).toHaveTextContent("Download resume");

    fireEvent.click(screen.getByRole("button", { name: "Close navigation menu" }));
    await waitFor(() => {
      expect(document.getElementById("public-menu")).toBeNull();
    });
  });

  it("reveals the back-to-top control after scrolling past the fold", async () => {
    renderShell();
    await screen.findAllByText("Ada Lovelace");

    expect(
      screen.queryByRole("button", { name: "Back to top" }),
    ).not.toBeInTheDocument();

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 900,
    });
    fireEvent.scroll(window);

    expect(
      await screen.findByRole("button", { name: "Back to top" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
  });
});

describe("PublicShell scrollspy", () => {
  let latestCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
    latestCallback = null;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          latestCallback = callback;
        }
        observe(): void {
          // Elements are reported manually through the captured callback.
        }
        disconnect(): void {
          // No-op — jsdom has no observer to tear down.
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderSpyShell() {
    const data = makeLayoutData({
      profile: makeProfile(),
      flags: { ...HIDDEN_FLAGS, about: true, projects: true, contact: true },
    });
    const router = createMemoryRouter(
      [
        {
          id: "public",
          path: "/",
          loader: () => Promise.resolve(data),
          element: <PublicLayout />,
          children: [
            {
              index: true,
              element: (
                <div>
                  <section id="about" />
                  <section id="projects" />
                  <section id="contact" />
                </div>
              ),
            },
            { path: "projects", element: <p>Projects page</p> },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    return router;
  }

  const fireIntersection = (id: string, isIntersecting = true): void => {
    expect(latestCallback).not.toBeNull();
    act(() => {
      latestCallback?.(
        [{ target: { id }, isIntersecting }] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      );
    });
  };

  it("highlights Work while the homepage projects section is in view", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    const work = screen.getByRole("link", { name: "Work" });
    expect(work.getAttribute("aria-current")).toBeNull();

    fireIntersection("projects");

    await waitFor(() => {
      expect(work.getAttribute("aria-current")).toBe("true");
    });
    expect(
      screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("keeps Work lit on /projects and clears stale section highlights", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    fireIntersection("contact");
    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "Contact" })
          .getAttribute("aria-current"),
      ).toBe("true");
    });

    fireEvent.click(screen.getByRole("link", { name: "Work" }));
    await screen.findByText("Projects page");

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Work" }).getAttribute("aria-current"),
      ).toBe("true");
      expect(
        screen
          .getByRole("link", { name: "Contact" })
          .getAttribute("aria-current"),
      ).toBeNull();
    });
  });
});
