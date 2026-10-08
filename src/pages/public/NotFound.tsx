import { Link } from "react-router";

/**
 * 404 page — always available, no data dependency. Pop Mono treatment:
 * paper canvas, black "404" numeral with a cobalt misprint offset, and the
 * pop ghost pill.
 */
export default function NotFound() {
  return (
    <div className="-mt-12 py-20 text-center lg:-mt-16 lg:py-28">
      <p
        aria-hidden="true"
        className="text-7xl font-extrabold tracking-[-0.05em] text-ink [text-shadow:4px_4px_0_0_var(--color-signal)] sm:text-8xl"
      >
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
