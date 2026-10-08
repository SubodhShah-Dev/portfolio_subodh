import { Link } from "react-router";

/**
 * 404 page — always available, no data dependency. Signal × Pop treatment:
 * a full-bleed cobalt band with a lime "404" and the pop ghost pill.
 */
export default function NotFound() {
  return (
    <div className="bleed -mt-12 border-y-2 border-ink bg-signal py-20 text-center text-on-signal lg:-mt-16 lg:py-28">
      <p
        aria-hidden="true"
        className="text-7xl font-extrabold tracking-[-0.05em] text-lime sm:text-8xl"
      >
        404
      </p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.02em] text-on-signal">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-6 text-on-signal/90">
        The page you are looking for does not exist or is no longer available.
      </p>
      <Link to="/" viewTransition className="cta-ghost mt-9">
        Back to home
      </Link>
    </div>
  );
}
