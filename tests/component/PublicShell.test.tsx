import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PublicLayout from "../../src/layouts/PublicLayout";
import * as smoothScroll from "../../src/utils/smoothScroll";
import type * as SmoothScrollModule from "../../src/utils/smoothScroll";
import { HIDDEN_FLAGS, makeLayoutData, makeProfile } from "../fixtures/publicContent";

vi.mock("../../src/utils/smoothScroll", async (importOriginal) => {
  const actual = await importOriginal<typeof SmoothScrollModule>();
  // Call-through: the real scrollToId announces the flight (which is what
  // the optimistic pill tests observe) while still being assertable.
  return { ...actual, scrollToId: vi.fn(actual.scrollToId) };
});

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
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
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

  /** jsdom has no layout — pin each section's top edge in viewport coords. */
  function setSectionTops(tops: Record<string, number>): void {
    for (const [id, top] of Object.entries(tops)) {
      const element = document.getElementById(id);
      expect(element).not.toBeNull();
      vi.spyOn(element as HTMLElement, "getBoundingClientRect").mockReturnValue({
        top,
        bottom: top + 400,
        left: 0,
        right: 1200,
        width: 1200,
        height: 400,
        x: 0,
        y: top,
        toJSON: () => ({}),
      });
    }
  }

  it("highlights Work while the projects section crosses the header offset", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    setSectionTops({ about: -400, projects: -100, contact: 800 });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Work" }).getAttribute("aria-current"),
      ).toBe("true");
    });
    expect(
      screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Contact" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("lights a section that landed within the settle tolerance band", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    // 100px sits between the 96px header offset and the offset + settle
    // tolerance — an anchor flight that re-measured mid-shift lands here,
    // and the clicked section must still own the highlight.
    setSectionTops({ about: -100, projects: 100, contact: 900 });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Work" }).getAttribute("aria-current"),
      ).toBe("true");
    });
    expect(
      screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("keeps Contact lit at the end of the page instead of falling back to Home", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    setSectionTops({ about: -3000, projects: -2400, contact: -1800 });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "Contact" })
          .getAttribute("aria-current"),
      ).toBe("true");
    });
    expect(
      screen.getByRole("link", { name: "Home" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("falls back to Home once no section owns the header offset", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    setSectionTops({ about: -3000, projects: -2400, contact: -1800 });
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "Contact" })
          .getAttribute("aria-current"),
      ).toBe("true");
    });

    setSectionTops({ about: 900, projects: 1500, contact: 2100 });
    fireEvent.scroll(window);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Home" }).getAttribute("aria-current"),
      ).toBe("true");
    });
    expect(
      screen.getByRole("link", { name: "Contact" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("keeps Work lit on /projects and clears stale section highlights", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    setSectionTops({ about: -900, projects: -500, contact: -100 });
    fireEvent.scroll(window);
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

  it("scrolls to a section when its link is re-clicked on the same hash", async () => {
    renderSpyShell();
    const contact = await screen.findByRole("link", { name: "Contact" });

    fireEvent.click(contact);
    await waitFor(() => {
      expect(smoothScroll.scrollToId).toHaveBeenCalledWith("contact");
    });

    // Same hash → the layout's location.hash effect does not re-run; only
    // the click handler can scroll again.
    vi.clearAllMocks();
    fireEvent.click(screen.getByRole("link", { name: "Contact" }));
    await waitFor(() => {
      expect(smoothScroll.scrollToId).toHaveBeenCalledWith("contact");
    });
  });

  /** Wait for one spy rAF tick (the update scheduled by the last scroll). */
  function nextSpyFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  it("lights the clicked section before the flight scrolls anywhere", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    setSectionTops({ about: -400, projects: 900, contact: 1500 });
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
      ).toBe("true");
    });

    // No scroll event follows — the announced flight target must win over
    // the spy's mid-page position on the very next render.
    fireEvent.click(screen.getByRole("link", { name: "Contact" }));

    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "Contact" })
          .getAttribute("aria-current"),
      ).toBe("true");
    });
    expect(
      screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
    ).toBeNull();
    expect(smoothScroll.scrollToId).toHaveBeenCalledWith("contact");
  });

  it("hands the highlight back to the scrollspy after the flight lands", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    setSectionTops({ about: -400, projects: 900, contact: 1500 });
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
      ).toBe("true");
    });

    fireEvent.click(screen.getByRole("link", { name: "Contact" }));
    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "Contact" })
          .getAttribute("aria-current"),
      ).toBe("true");
    });

    // Land: contact now crosses the band. Three quiet spy frames with no
    // lenis flight drop the intent, so the position spy owns the pill again.
    setSectionTops({ about: -1400, projects: -900, contact: 96 });
    for (let tick = 0; tick < 3; tick++) {
      fireEvent.scroll(window);
      await nextSpyFrame();
    }

    // Scrolled back up: without the hand-back this would still show Contact.
    setSectionTops({ about: -400, projects: 900, contact: 1500 });
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
      ).toBe("true");
    });
  });

  it("drops the announced intent the moment the visitor scrolls by hand", async () => {
    renderSpyShell();
    await screen.findByRole("navigation", { name: "Site navigation" });

    setSectionTops({ about: -400, projects: 900, contact: 1500 });
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
      ).toBe("true");
    });

    fireEvent.click(screen.getByRole("link", { name: "Contact" }));
    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "Contact" })
          .getAttribute("aria-current"),
      ).toBe("true");
    });

    fireEvent.wheel(window);

    // One scroll event is enough — the wheel dropped the intent, so the
    // position spy answers immediately (no hand-back grace in the way).
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "About" }).getAttribute("aria-current"),
      ).toBe("true");
    });
  });
});
