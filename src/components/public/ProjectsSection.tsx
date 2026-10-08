import { useEffect, useState } from "react";
import { Link } from "react-router";

import { ProjectCard } from "./ProjectCard";
import { ProjectShowcase } from "./ProjectShowcase";
import { Section } from "./Section";
import type { Project } from "../../types/project";

interface ProjectsSectionProps {
  projects: Project[];
  index?: number;
}

const PREVIEW_LIMIT = 6;
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Desktop flag for the showcase layout — matches Tailwind's `lg` breakpoint
 * so the grid/hand-off line is identical to the CSS above and below it.
 * The matchMedia stub in tests reports false, keeping jsdom on the carousel.
 */
function useDesktopLayout(): boolean {
  const [desktop, setDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent): void =>
      setDesktop(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

/**
 * Homepage project preview (§13) — featured-first preview capped at six.
 * Below 1024px it's the swipeable showcase carousel; at 1024px+ it becomes
 * a static 3-column grid of the /projects cards with no carousel chrome —
 * featured projects keep a normal cell, same as every other card.
 */
export function ProjectsSection({ projects, index }: ProjectsSectionProps) {
  const featuredFirst = [...projects].sort(
    (left, right) => Number(right.featured) - Number(left.featured),
  );
  const preview = featuredFirst.slice(0, PREVIEW_LIMIT);
  const desktop = useDesktopLayout();

  return (
    <Section id="projects" title="Projects" index={index}>
      {desktop ? (
        <ul className="grid grid-cols-3 gap-4">
          {preview.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <ProjectShowcase projects={preview} />
      )}
      <div className="mt-6">
        <Link to="/projects" className="btn-secondary">
          View all projects
        </Link>
      </div>
    </Section>
  );
}
