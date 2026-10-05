import { Link } from "react-router";

import { Badge } from "../ui/Badge";
import type { Project } from "../../types/project";

interface ProjectCardProps {
  project: Project;
  /** Shows the Featured badge (lists only). */
  showFeatured?: boolean;
}

/** Reusable project card shared by the homepage preview and /projects (§10). */
export function ProjectCard({ project, showFeatured = true }: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card group block p-5 transition-colors hover:border-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-100 transition-colors group-hover:text-emerald-400">
          {project.title}
        </h3>
        {showFeatured && project.featured && <Badge tone="emerald">Featured</Badge>}
      </div>
      {project.subtitle.trim() !== "" && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{project.subtitle}</p>
      )}
      {project.date !== undefined && project.date.trim() !== "" && (
        <p className="mt-2 font-mono text-xs text-slate-500">{project.date}</p>
      )}
      {project.techStack.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.techStack.map((technology) => (
            <li
              key={technology}
              className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] text-slate-400"
            >
              {technology}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
