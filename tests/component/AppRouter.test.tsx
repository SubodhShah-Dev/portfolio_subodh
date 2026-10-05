import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Router + layout smoke tests (§6, §7).
 *
 * Exercises real route wiring: sidebar shell, public navigation, project
 * listing route, and the 404 catch-all. Admin routes are covered by the
 * AuthContext-mocked suites in AdminLogin/ProtectedRoute tests.
 */
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

    expect(screen.getByRole("navigation", { name: "Site navigation" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
  });

  it("navigates to the Projects page via the sidebar", async () => {
    await renderAt("/");

    await userEvent.click(screen.getByRole("link", { name: "Work" }));

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
