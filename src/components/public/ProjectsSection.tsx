import { Link } from "react-router";

import { ProjectCard } from "./ProjectCard";
import { Section } from "./Section";
import type { Project } from "../../types/project";

interface ProjectsSectionProps {
  projects: Project[];
}

const PREVIEW_LIMIT = 6;

/**
 * Homepage project preview (§13) — featured projects first, then the rest
 * in their stored order, capped at six with a link to the full listing.
 */
export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const featuredFirst = [...projects].sort(
    (left, right) => Number(right.featured) - Number(left.featured),
  );
  const preview = featuredFirst.slice(0, PREVIEW_LIMIT);

  return (
    <Section id="projects" title="Projects">
      <ul className="grid gap-4 sm:grid-cols-2">
        {preview.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <Link to="/projects" className="btn-secondary">
          View all projects
        </Link>
      </div>
    </Section>
  );
}
