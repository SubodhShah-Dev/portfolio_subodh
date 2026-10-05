import { Link, isRouteErrorResponse, useRevalidator, useRouteError } from "react-router";

import { Button } from "../components/ui/Button";

/**
 * Public route error boundary (§43, §45).
 *
 * Covers loader failures for the layout and every child route. Raw errors
 * are logged for diagnostics but never rendered — users get a safe message,
 * a revalidation retry, and a way home.
 */
export default function PublicErrorBoundary() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  console.error(error);

  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div role="alert" className="py-16 text-center">
      <p className="text-sm font-medium text-emerald-400">{notFound ? "404" : "Error"}</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-100">
        {notFound ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
        {notFound
          ? "The page you are looking for does not exist or is no longer available."
          : "We couldn't load this page. Check your connection and try again."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        {!notFound && (
          <Button
            variant="secondary"
            loading={revalidator.state === "loading"}
            onClick={() => { void revalidator.revalidate(); }}
          >
            Try again
          </Button>
        )}
        <Link to="/" className="btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
