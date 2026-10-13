import { Link, useRouteLoaderData } from "react-router";
import { Download } from "lucide-react";

import NotFound from "./NotFound";
import type { PublicLayoutData } from "../../loaders/publicLoaders";

/**
 * Resume viewer (/resume) (§22) — the active CV rendered inline in an
 * iframe, gov-portal style, with a direct download beside the heading.
 * The loader resolves activeResume; no resume (or a missing URL) renders
 * the same Not Found state as unknown routes.
 */
export default function Resume() {
  const { activeResume } = useRouteLoaderData("public") as PublicLayoutData;

  if (activeResume === null || activeResume.downloadUrl.trim() === "") {
    return <NotFound />;
  }

  const fileName =
    activeResume.fileName !== undefined && activeResume.fileName.trim() !== ""
      ? activeResume.fileName.trim()
      : "Resume.pdf";

  return (
    <article className="space-y-6">
      <Link
        to="/"
        className="inline-block font-meta text-sm text-muted transition-colors hover:text-signal"
      >
        ← Back
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
            Resume
          </h1>
          <p className="mt-2 font-meta text-xs text-muted">{fileName}</p>
        </div>
        <a
          className="cta-primary"
          href={activeResume.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download aria-hidden="true" className="size-4" />
          Download
        </a>
      </header>

      <div className="overflow-hidden rounded-chunk border-2 border-ink bg-canvas shadow-pop">
        <iframe
          src={activeResume.downloadUrl}
          title="Resume preview"
          className="h-[78vh] w-full bg-canvas"
        />
      </div>
    </article>
  );
}
