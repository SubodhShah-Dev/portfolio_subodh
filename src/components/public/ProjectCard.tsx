import { Link } from "react-router";

import { Badge } from "../ui/Badge";
import type { Project } from "../../types/project";

interface ProjectCardProps {
  project: Project;
  /** Shows the Featured badge (lists only). */
  showFeatured?: boolean;
  /** Full-width hero variant used for the homepage spotlight. */
  spotlight?: boolean;
}

/** Reusable project card — thumbnail-led, shared by home, lists, and spotlight (§10). */
export function ProjectCard({
  project,
  showFeatured = true,
  spotlight = false,
}: ProjectCardProps) {
  const hasThumb =
    project.thumbnailUrl !== undefined && project.thumbnailUrl.trim() !== "";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/40 transition-colors hover:border-emerald-500/40"
    >
      {hasThumb && (
        <div
          className={`overflow-hidden border-b border-slate-800/70 bg-slate-950 ${
            spotlight ? "aspect-[21/9]" : "aspect-[16/10]"
          }`}
        >
          <img
            src={project.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className={spotlight ? "p-6" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-display font-semibold text-slate-100 ${
              spotlight ? "text-2xl" : "text-lg"
            }`}
          >
            {project.title}
          </h3>
          {showFeatured && project.featured && <Badge tone="emerald">Featured</Badge>}
        </div>
        {project.subtitle.trim() !== "" && (
          <p
            className={`mt-1.5 text-pretty text-slate-400 ${
              spotlight ? "max-w-3xl text-base" : "line-clamp-2 text-sm"
            }`}
          >
            {project.subtitle}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {project.date !== undefined && project.date.trim() !== "" && (
            <p className="font-meta text-xs text-slate-600 tabular-nums">
              {project.date}
            </p>
          )}
          {project.techStack.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {project.techStack.map((technology) => (
                <li
                  key={technology}
                  className="rounded-full border border-slate-800 bg-slate-950/70 px-2 py-0.5 font-meta text-[11px] text-slate-400"
                >
                  {technology}
                </li>
              ))}
            </ul>
          )}
        </div>
        {spotlight && (
          <p className="mt-5 font-meta text-xs text-emerald-400">
            View project →
          </p>
        )}
      </div>
    </Link>
  );
}
