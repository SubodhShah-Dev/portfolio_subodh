import { useMemo, useState } from "react";
import { useRouteLoaderData } from "react-router";

import { ProjectCard } from "../../components/public/ProjectCard";
import { EmptyState } from "../../components/ui/EmptyState";
import type { PublicLayoutData } from "../../loaders/publicLoaders";

const FILTER_ALL = null;

/**
 * Published project listing with technology filtering (§13).
 * Data arrives ready from the layout loader — filtering is client-side.
 */
export default function Projects() {
  const data = useRouteLoaderData("public") as PublicLayoutData;
  const projects = data.projects;
  const [selectedTech, setSelectedTech] = useState<string | null>(FILTER_ALL);

  const technologies = useMemo(() => {
    const unique = new Set<string>();
    for (const project of projects) {
      for (const technology of project.techStack) unique.add(technology);
    }
    return [...unique].sort((left, right) => left.localeCompare(right));
  }, [projects]);

  const visible =
    selectedTech === null
      ? projects
      : projects.filter((project) => project.techStack.includes(selectedTech));

  return (
    <section aria-labelledby="projects-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/12 pb-6">
        <h1
          id="projects-heading"
          className="font-display text-4xl text-ink sm:text-5xl"
        >
          Projects
        </h1>
        <p className="font-meta text-xs text-ink/80 tabular-nums">
          {projects.length} published
        </p>
      </div>

      {technologies.length > 1 && (
        <div
          role="group"
          aria-label="Filter projects by technology"
          className="mt-6 flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={selectedTech === FILTER_ALL}
            onClick={() => setSelectedTech(FILTER_ALL)}
            className={`cursor-pointer border px-3.5 py-1.5 font-meta text-xs transition-colors ${
              selectedTech === FILTER_ALL
                ? "border-accent/50 bg-accent/10 text-accent-deep"
                : "border-ink/30 bg-paper-raised/60 text-ink/80 hover:text-ink"
            }`}
          >
            All
          </button>
          {technologies.map((technology) => (
            <button
              key={technology}
              type="button"
              aria-pressed={selectedTech === technology}
              onClick={() => setSelectedTech(technology)}
              className={`cursor-pointer border px-3.5 py-1.5 font-meta text-xs transition-colors ${
                selectedTech === technology
                  ? "border-accent/50 bg-accent/10 text-accent-deep"
                  : "border-ink/30 bg-paper-raised/60 text-ink/80 hover:text-ink"
              }`}
            >
              {technology}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {visible.length === 0 ? (
          <EmptyState
            title="No projects to show"
            description="Published projects will appear here."
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {visible.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
