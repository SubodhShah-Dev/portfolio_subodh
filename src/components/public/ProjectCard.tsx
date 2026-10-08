import { Link } from "react-router";

import { Tag } from "./Tag";
import type { Project } from "../../types/project";

interface ProjectCardProps {
  project: Project;
  /** Shows the Featured badge (lists only). */
  showFeatured?: boolean;
  /**
   * stack — compact vertical card (image on top), for 2-column grids.
   * split — full-width showcase card: image left / content right at lg+,
   * stacked below (used on the Projects page and the homepage spotlight).
   */
  layout?: "stack" | "split";
}

export function ProjectCard({
  project,
  showFeatured = true,
  layout = "stack",
}: ProjectCardProps) {
  const hasThumb =
    project.thumbnailUrl !== undefined && project.thumbnailUrl.trim() !== "";
  const split = layout === "split";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group pop-card pop-card-link block overflow-hidden"
    >
      <div className={split ? "lg:grid lg:grid-cols-[1.1fr_1fr]" : undefined}>
        {hasThumb && (
          <div
            className={
              split
                ? "aspect-[16/10] overflow-hidden border-b-2 border-ink bg-canvas lg:aspect-auto lg:min-h-[24rem] lg:border-r-2 lg:border-b-0"
                : "aspect-[3/2] overflow-hidden border-b border-hairline bg-canvas"
            }
          >
            <img
              src={project.thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className={split ? "flex flex-col p-6 lg:p-8" : "p-5"}>
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`font-display font-extrabold tracking-[-0.02em] text-ink ${
                split ? "text-xl lg:text-2xl" : "text-lg"
              }`}
            >
              {project.title}
            </h3>
            {showFeatured && project.featured && <Tag accent>Featured</Tag>}
          </div>
          {project.subtitle.trim() !== "" && (
            <p
              className={`mt-1.5 text-pretty text-muted ${
                split ? "line-clamp-3 text-base" : "line-clamp-2 text-sm"
              }`}
            >
              {project.subtitle}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {project.date !== undefined && project.date.trim() !== "" && (
              <p className="font-meta text-xs text-muted tabular-nums">
                {project.date}
              </p>
            )}
            {project.techStack.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {project.techStack.map((technology) => (
                  <li
                    key={technology}
                    className="border border-hairline px-2 py-0.5 font-meta text-[11px] text-muted"
                  >
                    {technology}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {split && (
            <p className="mt-auto pt-5 font-meta text-xs text-signal-deep">
              View project →
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
