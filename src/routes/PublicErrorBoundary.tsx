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
    <div role="alert" className="public-scope py-24 text-center">
      <p className="font-meta text-sm tracking-widest text-accent-deep uppercase">
        {notFound ? "404" : "Error"}
      </p>
      <h1 className="mt-4 font-display text-4xl text-ink">
        {notFound ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-6 text-ink/80">
        {notFound
          ? "The page you are looking for does not exist or is no longer available."
          : "We couldn't load this page. Check your connection and try again."}
      </p>
      <div className="mt-9 flex justify-center gap-3">
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
