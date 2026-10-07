import { Link } from "react-router";

import { ProjectCard } from "./ProjectCard";
import { Section } from "./Section";
import type { Project } from "../../types/project";

interface ProjectsSectionProps {
  projects: Project[];
  index?: number;
}

const PREVIEW_LIMIT = 6;

/**
 * Homepage project preview (§13) — the featured project gets a full-width
 * spotlight above the remaining preview (featured first, capped at six),
 * with a link to the full listing.
 */
export function ProjectsSection({ projects, index }: ProjectsSectionProps) {
  const featuredFirst = [...projects].sort(
    (left, right) => Number(right.featured) - Number(left.featured),
  );
  const preview = featuredFirst.slice(0, PREVIEW_LIMIT);
  const spotlight = preview.find((project) => project.featured) ?? null;
  const rest =
    spotlight === null
      ? preview
      : preview.filter((project) => project.id !== spotlight.id);

  return (
    <Section id="projects" title="Projects" index={index}>
      {spotlight !== null && (
        <div className="mb-5">
          <ProjectCard project={spotlight} spotlight />
        </div>
      )}
      {rest.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rest.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <Link to="/projects" className="btn-secondary">
          View all projects
        </Link>
      </div>
    </Section>
  );
}
