import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicLayoutData } from "../../src/loaders/publicLoaders";

/**
 * Router + layout smoke tests (§6, §7).
 *
 * Exercises real route wiring: sidebar shell, public navigation, project
 * listing route, and the 404 catch-all. Admin routes are covered by the
 * AuthContext-mocked suites in AdminLogin/ProtectedRoute tests.
 *
 * Loaders are mocked so no Firestore access happens; the fixture is an
 * honest empty portfolio (no fabricated content anywhere).
 */
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
    publicLayoutLoader: vi.fn(() => Promise.resolve(emptyLayout)),
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
  });

  it("renders the public sidebar layout at /", async () => {
    await renderAt("/");

    expect(
      await screen.findByRole("navigation", { name: "Site navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
  });

  it("navigates to the Projects page via the sidebar", async () => {
    await renderAt("/");

    await userEvent.click(await screen.findByRole("link", { name: "Work" }));

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects");
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
