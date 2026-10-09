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
    logoUrl: null,
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
    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
  });

  it("navigates to the Projects page via the header navigation", async () => {
    await renderAt("/");

    await userEvent.click(await screen.findByRole("link", { name: "Work" }));

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects");
  });

  it("keeps exactly one Download resume link across header and hero", async () => {
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
    const downloads = screen.getAllByRole("link", { name: "Download resume" });
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toHaveAttribute("href", "https://example.com/resume.pdf");
    const getInTouch = screen.getByRole("link", { name: "Get in touch" });
    expect(getInTouch).toHaveAttribute("href", "/#contact");
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
