import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContextValue } from "../../src/context/AuthContext";
import { useAuth } from "../../src/hooks/useAuth";
import AdminLogin from "../../src/pages/admin/AdminLogin";
import { createAppError } from "../../src/utils/firebaseErrors";

vi.mock("../../src/hooks/useAuth", () => ({ useAuth: vi.fn() }));

const useAuthMock = vi.mocked(useAuth);

function DashboardProbe() {
  const location = useLocation();
  return <div data-testid="dashboard-probe">{location.pathname}</div>;
}

function makeAuthValue(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    status: "unauthenticated",
    user: null,
    adminStatus: "idle",
    adminError: null,
    signIn: vi.fn(async () => {}),
    signOutUser: vi.fn(async () => {}),
    recheckAdmin: vi.fn(async () => {}),
    ...overrides,
  };
}

function renderLogin(value: AuthContextValue) {
  useAuthMock.mockReturnValue(value);
  return render(
    <MemoryRouter initialEntries={["/admin/login"]}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<DashboardProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders accessible labeled fields", () => {
    renderLogin(makeAuthValue({}));
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows field validation errors and does not call signIn when empty", async () => {
    const value = makeAuthValue({});
    renderLogin(value);

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(value.signIn).not.toHaveBeenCalled();
  });

  it("rejects invalid email format before submitting", async () => {
    const value = makeAuthValue({});
    renderLogin(value);

    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Email must be a valid email address.")).toBeInTheDocument();
    expect(value.signIn).not.toHaveBeenCalled();
  });

  it("signs in with trimmed credentials and navigates to the dashboard", async () => {
    const value = makeAuthValue({});
    renderLogin(value);

    await userEvent.type(screen.getByLabelText("Email"), "  admin@example.com ");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(value.signIn).toHaveBeenCalledWith("admin@example.com", "secret123");
    expect(await screen.findByTestId("dashboard-probe")).toBeInTheDocument();
  });

  it("shows a normalized error message when sign-in fails", async () => {
    const value = makeAuthValue({
      signIn: vi.fn(() => Promise.reject(createAppError("unauthenticated", "Incorrect email or password."))),
    });
    renderLogin(value);

    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Incorrect email or password.");
  });

  it("prevents duplicate submissions while signing in", async () => {
    let resolveSignIn!: () => void;
    const signIn = vi.fn(() => new Promise<void>((resolve) => {
      resolveSignIn = resolve;
    }));
    const value = makeAuthValue({ signIn });
    renderLogin(value);

    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");

    const button = screen.getByRole("button", { name: "Sign in" });
    await userEvent.click(button);

    const pending = await screen.findByRole("button", { name: "Signing in…" });
    expect(pending).toBeDisabled();

    await userEvent.click(pending);
    expect(signIn).toHaveBeenCalledTimes(1);

    resolveSignIn();
  });

  it("redirects an already-authorized admin to the dashboard", () => {
    renderLogin(makeAuthValue({ status: "authenticated", adminStatus: "verified" }));
    expect(screen.getByTestId("dashboard-probe")).toBeInTheDocument();
  });

  it("shows an explicit no-access state for signed-in non-admin users", async () => {
    const value = makeAuthValue({ status: "authenticated", adminStatus: "denied" });
    renderLogin(value);

    expect(screen.getByRole("heading", { name: "No admin access" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(value.signOutUser).toHaveBeenCalledTimes(1);
  });
});
