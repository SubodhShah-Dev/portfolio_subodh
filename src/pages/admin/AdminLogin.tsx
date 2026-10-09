import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import { useAuth } from "../../hooks/useAuth";
import { isAppError } from "../../utils/firebaseErrors";
import { emailError, requiredError } from "../../utils/validation";

interface FieldErrors {
  email?: string;
  password?: string;
}

function readFromState(state: unknown): string {
  if (typeof state === "object" && state !== null && "from" in state) {
    const from = (state as { from?: unknown }).from;
    if (typeof from === "string") return from;
  }
  return "/admin/dashboard";
}

/**
 * /admin/login — the only unauthenticated admin route (§6).
 *
 * Sign-in proves identity; administrator authorization is verified separately
 * by AuthContext before any /admin/* content renders (§31).
 */
export default function AdminLogin() {
  const { status, adminStatus, signIn, signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = readFromState(location.state);

  if (status === "authenticated" && adminStatus === "verified") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    const emailProblem = emailError("Email", email);
    const passwordProblem = requiredError("Password", password);
    if (emailProblem !== null) errors.email = emailProblem;
    if (passwordProblem !== null) errors.password = passwordProblem;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return; // prevent duplicate submissions (§43)
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(
        isAppError(error) ? error.message : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Signed in, but not authorized as admin → explicit state, not a loop (§31).
  if (status === "authenticated" && adminStatus === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-100">No admin access</h1>
          <p className="mt-3 text-sm text-slate-400">
            This account is signed in but is not authorized to manage this portfolio.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                void signOutUser();
              }}
            >
              Sign out
            </button>
            <a href="/" className="btn-secondary">
              Public site
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-100">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with your administrator account.
          </p>

          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            noValidate
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm text-slate-300">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={fieldErrors.email !== undefined}
                aria-describedby={fieldErrors.email !== undefined ? "login-email-error" : undefined}
                disabled={submitting}
              />
              {fieldErrors.email !== undefined && (
                <p id="login-email-error" className="mt-1.5 text-xs text-red-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm text-slate-300">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={fieldErrors.password !== undefined}
                aria-describedby={
                  fieldErrors.password !== undefined ? "login-password-error" : undefined
                }
                disabled={submitting}
              />
              {fieldErrors.password !== undefined && (
                <p id="login-password-error" className="mt-1.5 text-xs text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {formError !== null && (
              <p role="alert" className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {formError}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/" className="text-slate-400 transition-colors hover:text-emerald-400">
            ← Back to public site
          </Link>
        </p>
      </div>
    </main>
  );
}
