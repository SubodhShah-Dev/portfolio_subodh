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

  return (
    <article className="space-y-8">
      <Link
        to="/projects"
        className="inline-block text-sm text-emerald-400 hover:underline"
      >
        ← Back to projects
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-100">{project.title}</h1>
          {project.featured && <Badge tone="emerald">Featured</Badge>}
          {project.date !== undefined && project.date.trim() !== "" && (
            <span className="font-mono text-sm text-slate-500">{project.date}</span>
          )}
        </div>
        {project.subtitle.trim() !== "" && (
          <p className="max-w-2xl text-lg text-slate-400">{project.subtitle}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((technology) => (
            <span
              key={technology}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
            >
              {technology}
            </span>
          ))}
        </div>
      </header>

      {project.thumbnailUrl !== undefined && project.thumbnailUrl.trim() !== "" && (
        <img
          src={project.thumbnailUrl}
          alt={`Screenshot of ${project.title}`}
          loading="lazy"
          className="w-full rounded-xl border border-slate-800"
        />
      )}

      {project.description.trim() !== "" && (
        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="text-lg font-semibold text-slate-100">
            Overview
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">
            {project.description}
          </p>
        </section>
      )}

      {project.features.length > 0 && (
        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-lg font-semibold text-slate-100">
            Features
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-400">
            {project.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>
      )}

      {hasArchitecture && (
        <section aria-labelledby="architecture-heading">
          <h2
            id="architecture-heading"
            className="text-lg font-semibold text-slate-100"
          >
            Architecture
          </h2>
          <div className="card mt-3 p-4">
            <p className="whitespace-pre-wrap font-mono text-xs leading-6 text-slate-400">
              {project.architecture}
            </p>
          </div>
        </section>
      )}

      {(hasLiveDemo || hasGithub) && (
        <div className="flex flex-wrap gap-3">
          {hasLiveDemo && (
            <a
              className="btn-primary"
              href={project.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live demo
            </a>
          )}
          {hasGithub && (
            <a
              className="btn-secondary"
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
