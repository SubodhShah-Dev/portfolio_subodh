import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../hooks/useAuth";
import type { AppError } from "../types/common";

/**
 * Route gate for every /admin/* route except /admin/login (§6).
 *
 * Three distinct outcomes — authentication and authorization are separate:
 *  1. Still loading (auth or admin check) → accessible loading state
 *  2. Unauthenticated → redirect to /admin/login preserving the origin
 *  3. Authenticated but not admin → AccessDenied (never a silent redirect loop)
 *
 * A transient admin-verification failure gets its own retry state so a network
 * blip is not misreported as "access denied".
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, adminStatus, adminError, recheckAdmin } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <AccessLoading />;
  }

  if (status === "unauthenticated") {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/admin/login" replace state={{ from }} />;
  }

  if (adminStatus === "checking" || adminStatus === "idle") {
    return <AccessLoading />;
  }

  if (adminStatus === "verified") {
    return <>{children}</>;
  }

  if (adminStatus === "error") {
    return <AccessError error={adminError} onRetry={recheckAdmin} />;
  }

  return <AccessDenied />;
}

function AccessLoading() {
  return (
    <div
      className="grid min-h-[60vh] place-items-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-500">Verifying access…</p>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-100">Access denied</h1>
        <p className="mt-3 text-sm text-slate-400">
          This account does not have administrator access.
        </p>
        <a href="/" className="btn-secondary mt-6">
          Return to the public site
        </a>
      </div>
    </main>
  );
}

function AccessError({
  error,
  onRetry,
}: {
  error: AppError | null;
  onRetry: () => Promise<void>;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-100">Unable to verify access</h1>
        <p className="mt-3 text-sm text-slate-400" role="alert">
          {error?.message ?? "A network error occurred. Check your connection and try again."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              void onRetry();
            }}
          >
            Try again
          </button>
          <a href="/" className="btn-secondary">
            Public site
          </a>
        </div>
      </div>
    </main>
  );
}
