import { Link } from "react-router";

/**
 * 404 page — always available, no data dependency.
 */
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p aria-hidden="true" className="text-7xl font-extrabold tracking-[-0.05em] text-signal sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-ink">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-6 text-muted">
        The page you are looking for does not exist or is no longer available.
      </p>
      <Link to="/" viewTransition className="cta-ghost mt-9">
        Back to home
      </Link>
    </div>
  );
}
