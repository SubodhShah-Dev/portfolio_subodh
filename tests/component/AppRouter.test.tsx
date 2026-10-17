import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HIDDEN_FLAGS, makeLayoutData, makeProfile } from "../fixtures/publicContent";
import type { PublicLayoutData } from "../../src/loaders/publicLoaders";

/**
 * Router + layout smoke tests (§6, §7).
 *
 * Exercises real route wiring: top-nav shell, public navigation, project
 * listing route, and the 404 catch-all. Admin routes are covered by the
 * AuthContext-mocked suites in AdminLogin/ProtectedRoute tests.
 *
 * Loaders are mocked so no Firestore access happens; the default fixture
 * is an honest empty portfolio (no fabricated content anywhere). Tests
 * that need content swap in a layout via `loaderResult.layout`.
 */
const loaderResult = vi.hoisted(() => ({
  layout: null as PublicLayoutData | null,
}));

vi.mock("../../src/loaders/publicLoaders", () => {
  const emptyLayout: PublicLayoutData = {
    profile: null,
    activeResume: null,
    socialLinks: [],
    contactSettings: null,
    siteEnabled: true,
    siteTitle: null,
    siteDescription: null,
    navIconUrl: null,
    faviconUrl: null,
    footerText: null,
    flags: {
      hero: false,
      about: false,
      skills: false,
      projects: false,
      experience: false,
      education: false,
      certifications: false,
      contact: false,
    },
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
  };
  return {
    publicLayoutLoader: vi.fn(() =>
      Promise.resolve(loaderResult.layout ?? emptyLayout),
    ),
    projectLoader: vi.fn(() => Promise.resolve({ project: null })),
  };
});
async function renderAt(path: string, options: { withAuth?: boolean } = {}) {
  vi.resetModules(); // fresh createBrowserRouter bound to the current URL
  window.history.pushState({}, "", path);
  const [{ default: AppRouter }, { AuthProvider }] = await Promise.all([
    import("../../src/routes/AppRouter"),
    import("../../src/context/AuthContext"),
  ]);
  const tree =
    options.withAuth === true ? (
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    ) : (
      <AppRouter />
    );
  return render(tree);
}

describe("AppRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loaderResult.layout = null;
  });

  it("renders the public top-nav layout at /", async () => {
    await renderAt("/");

    expect(
      await screen.findByRole("navigation", { name: "Site navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
  });

  it("shows the nav icon when navIconUrl is set", async () => {
    loaderResult.layout = makeLayoutData({
      profile: makeProfile(),
      navIconUrl: "/brand/nav-icon.jpg",
    });

    await renderAt("/");

    const brandLinks = await screen.findAllByRole("link", {
      name: "Ada Lovelace",
    });
    const brand = brandLinks.find((link) => link.querySelector("img"));
    expect(brand).toBeDefined();
    if (brand === undefined) return;
    const icon = brand.querySelector("img");
    expect(icon).toHaveAttribute("src", "/brand/nav-icon.jpg");
    expect(icon).toHaveAttribute("alt", "");
    // The nav icon replaces the SS monogram and the name/role line entirely.
    expect(brand.textContent).toBe("");
    expect(brand.querySelector("span")).toBeNull();
  });

  it("shows the SS monogram when no nav icon is set", async () => {
    loaderResult.layout = makeLayoutData({ profile: makeProfile() });

    await renderAt("/");

    const brandLinks = await screen.findAllByRole("link", {
      name: /Ada Lovelace/,
    });
    expect(brandLinks.length).toBeGreaterThan(0);
    const monogram = brandLinks.find((link) =>
      link.textContent?.includes("SS"),
    );
    expect(monogram).toBeDefined();
    expect(monogram?.querySelector("span")?.textContent).toBe("SS");
    expect(monogram?.querySelector("img")).toBeNull();
    // The brand carries the accessible name; no stray text or role line shows.
    expect(screen.queryByAltText("Ada Lovelace")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Software Engineer"),
    ).not.toBeInTheDocument();
  });

  it("navigates to the Projects page via the header navigation", async () => {
    await renderAt("/");

    await userEvent.click(await screen.findByRole("link", { name: "Projects" }));

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects");
  });

  it("offers the resume via the hero Resume CTA and /resume page", async () => {
    loaderResult.layout = makeLayoutData({
      profile: makeProfile(),
      activeResume: {
        id: "r1",
        source: "external",
        downloadUrl: "https://example.com/resume.pdf",
        isActive: true,
        updatedAt: Timestamp.now(),
      },
      flags: { ...HIDDEN_FLAGS, hero: true, contact: true },
    });

    await renderAt("/");

    expect(
      await screen.findByRole("heading", { name: "Ada Lovelace" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Download resume" }),
    ).not.toBeInTheDocument();
    const resume = screen.getByRole("link", { name: "Resume" });
    expect(resume).toHaveAttribute("href", "/resume");
    expect(
      screen.queryByRole("link", { name: "Get in touch" }),
    ).not.toBeInTheDocument();
  });

  it("renders NotFound for unknown routes", async () => {
    await renderAt("/definitely-not-a-page");

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });

  it("renders the admin login route under AuthProvider", async () => {
    await renderAt("/admin/login", { withAuth: true });

    expect(
      await screen.findByRole("heading", { name: "Admin sign in" }),
    ).toBeInTheDocument();
  });
});
