import { Link } from "react-router";

/**
 * 404 page — always available, no data dependency.
 */
export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-7xl font-semibold text-slate-700 sm:text-8xl">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-slate-100">
        Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-6 text-slate-400">
        The page you are looking for does not exist or is no longer available.
      </p>
      <Link to="/" className="cta-ghost mt-9">
        Back to home
      </Link>
    </div>
  );
}
