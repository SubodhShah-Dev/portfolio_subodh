import { Link } from "react-router";

/**
 * 404 page — always available, no data dependency.
 */
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-medium text-emerald-400">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-100">Page not found</h1>
      <p className="mt-3 text-sm text-slate-400">
        The page you are looking for does not exist or is no longer available.
      </p>
      <Link to="/" className="btn-secondary mt-8">
        Back to home
      </Link>
    </div>
  );
}
