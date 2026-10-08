import { Link } from "react-router";

import { ProjectShowcase } from "./ProjectShowcase";
import { Section } from "./Section";
import type { Project } from "../../types/project";

interface ProjectsSectionProps {
  projects: Project[];
  index?: number;
}

const PREVIEW_LIMIT = 6;

/**
 * Homepage project preview (§13) — a swipeable showcase carousel of the
 * featured-first preview (capped at six), with a link to the full listing.
 */
export function ProjectsSection({ projects, index }: ProjectsSectionProps) {
  const featuredFirst = [...projects].sort(
    (left, right) => Number(right.featured) - Number(left.featured),
  );
  const preview = featuredFirst.slice(0, PREVIEW_LIMIT);

  return (
    <Section id="projects" title="Projects" index={index}>
      <ProjectShowcase projects={preview} />
      <div className="mt-6">
        <Link to="/projects" className="btn-secondary">
          View all projects
        </Link>
      </div>
    </Section>
  );
}
