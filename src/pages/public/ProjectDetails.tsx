import { Link, useLoaderData } from "react-router";

import NotFound from "./NotFound";
import { Badge } from "../../components/ui/Badge";
import type { Project } from "../../types/project";

/**
 * Project detail route (/projects/:id) (§14, §53).
 *
 * Missing, draft, and archived ids all resolve to `project: null` from the
 * loader — this page renders the same Not Found state for each, without
 * leaking whether the project exists.
 */
export default function ProjectDetails() {
  const { project } = useLoaderData<{ project: Project | null }>();

  if (project === null) return <NotFound />;

  const hasLiveDemo = project.liveDemoUrl !== undefined && project.liveDemoUrl.trim() !== "";
  const hasGithub = project.githubUrl !== undefined && project.githubUrl.trim() !== "";
  const hasArchitecture =
    project.architecture !== undefined && project.architecture.trim() !== "";
  const hasThumb =
    project.thumbnailUrl !== undefined && project.thumbnailUrl.trim() !== "";

  return (
    <article className="space-y-10">
      <Link
        to="/projects"
        className="inline-block font-meta text-sm text-slate-400 transition-colors hover:text-emerald-400"
      >
        ← Back to projects
      </Link>

      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-tight font-semibold text-slate-50">
            {project.title}
          </h1>
          {project.featured && <Badge tone="emerald">Featured</Badge>}
          {project.date !== undefined && project.date.trim() !== "" && (
            <span className="font-meta text-sm text-slate-400 tabular-nums">
              {project.date}
            </span>
          )}
        </div>
        {project.subtitle.trim() !== "" && (
          <p className="max-w-3xl text-xl text-pretty text-slate-400">
            {project.subtitle}
          </p>
        )}
        {project.techStack.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {project.techStack.map((technology) => (
              <li
                key={technology}
                className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 font-meta text-xs text-slate-400"
              >
                {technology}
              </li>
            ))}
          </ul>
        )}
      </header>

      {hasThumb && (
        <img
          src={project.thumbnailUrl}
          alt={`Screenshot of ${project.title}`}
          loading="lazy"
          className="w-full rounded-xl border border-slate-800/70"
        />
      )}

      {project.description.trim() !== "" && (
        <section aria-labelledby="overview-heading">
          <h2
            id="overview-heading"
            className="font-display text-2xl font-semibold text-slate-100"
          >
            Overview
          </h2>
          <p className="mt-4 max-w-3xl whitespace-pre-wrap text-pretty text-base leading-8 text-slate-300">
            {project.description}
          </p>
        </section>
      )}

      {project.features.length > 0 && (
        <section aria-labelledby="features-heading">
          <h2
            id="features-heading"
            className="font-display text-2xl font-semibold text-slate-100"
          >
            Features
          </h2>
          <ul className="mt-4 max-w-3xl space-y-2.5">
            {project.features.map((feature) => (
              <li
                key={feature}
                className="flex gap-3 text-pretty text-sm leading-7 text-slate-400"
              >
                <span aria-hidden="true" className="text-emerald-400">
                  →
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasArchitecture && (
        <section aria-labelledby="architecture-heading">
          <h2
            id="architecture-heading"
            className="font-display text-2xl font-semibold text-slate-100"
          >
            Architecture
          </h2>
          <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-900/40 p-5">
            <p className="whitespace-pre-wrap font-meta text-xs leading-6 text-slate-400">
              {project.architecture}
            </p>
          </div>
        </section>
      )}

      {(hasLiveDemo || hasGithub) && (
        <div className="flex flex-wrap gap-4 pt-2">
          {hasLiveDemo && (
            <a
              className="cta-primary"
              href={project.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live demo
            </a>
          )}
          {hasGithub && (
            <a
              className="cta-ghost"
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source code
            </a>
          )}
        </div>
      )}
    </article>
  );
}
