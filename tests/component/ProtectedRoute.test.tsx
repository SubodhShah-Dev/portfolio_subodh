import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContextValue } from "../../src/context/AuthContext";
import { useAuth } from "../../src/hooks/useAuth";
import ProtectedRoute from "../../src/routes/ProtectedRoute";

vi.mock("../../src/hooks/useAuth", () => ({ useAuth: vi.fn() }));

const useAuthMock = vi.mocked(useAuth);

function makeAuthValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    status: "authenticated",
    user: null,
    adminStatus: "verified",
    adminError: null,
    signIn: vi.fn(async () => {}),
    signOutUser: vi.fn(async () => {}),
    recheckAdmin: vi.fn(async () => {}),
    ...overrides,
  };
}

function LoginProbe() {
  const location = useLocation();
  return <div data-testid="login-probe">{location.pathname}</div>;
}

function renderProtected(value: AuthContextValue) {
  useAuthMock.mockReturnValue(value);
  return render(
    <MemoryRouter initialEntries={["/admin/projects"]}>
      <Routes>
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute>
              <div>PROTECTED_CONTENT</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/login" element={<LoginProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an accessible loading state while authentication resolves", () => {
    renderProtected(makeAuthValue({ status: "loading" }));
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Verifying access…")).toBeInTheDocument();
  });

  it("shows the loading state while admin verification is in progress", () => {
    renderProtected(makeAuthValue({ adminStatus: "checking" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to /admin/login", () => {
    renderProtected(makeAuthValue({ status: "unauthenticated", adminStatus: "idle" }));
    expect(screen.getByTestId("login-probe")).toHaveTextContent("/admin/login");
    expect(screen.queryByText("PROTECTED_CONTENT")).not.toBeInTheDocument();
  });

  it("renders children for a verified administrator", () => {
    renderProtected(makeAuthValue({ adminStatus: "verified" }));
    expect(screen.getByText("PROTECTED_CONTENT")).toBeInTheDocument();
  });

  it("shows AccessDenied for authenticated non-admin users", () => {
    renderProtected(makeAuthValue({ adminStatus: "denied" }));
    expect(screen.getByRole("heading", { name: "Access denied" })).toBeInTheDocument();
    expect(screen.queryByText("PROTECTED_CONTENT")).not.toBeInTheDocument();
  });

  it("offers a retry when admin verification fails, without misreporting denial", async () => {
    const recheckAdmin = vi.fn(async () => {});
    renderProtected(makeAuthValue({ adminStatus: "error", recheckAdmin }));

    expect(screen.getByRole("heading", { name: "Unable to verify access" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(recheckAdmin).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Access denied")).not.toBeInTheDocument();
  });
});
