import { Link } from "react-router";

import { Tag } from "./Tag";
import type { Project } from "../../types/project";

interface ProjectCardProps {
  project: Project;
  /** Shows the Featured badge (lists only). */
  showFeatured?: boolean;
  /** Homepage bento hero — the flexible thumbnail absorbs the 2×2 cell's
      extra height and the title steps up one size. */
  hero?: boolean;
}

/**
 * Reusable project card — compact vertical card with a 16:10 thumbnail,
 * hairline frame on raised surface, signal border + offset shadow on hover.
 * Used by the /projects listing and the homepage desktop grid; the mobile
 * homepage showcase carries its own slide variant.
 */
export function ProjectCard({
  project,
  showFeatured = true,
  hero = false,
}: ProjectCardProps) {
  const hasThumb =
    project.thumbnailUrl !== undefined && project.thumbnailUrl.trim() !== "";

  return (
    <Link
      to={`/projects/${project.id}`}
      className={[
        "group pop-card pop-card-link h-full overflow-hidden",
        hero ? "flex flex-col" : "block",
      ].join(" ")}
    >
      {hasThumb && (
        <div
          className={
            hero
              ? "min-h-40 flex-1 overflow-hidden border-b border-hairline bg-canvas"
              : "aspect-[16/10] overflow-hidden border-b border-hairline bg-canvas"
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
      <div className={hero ? "p-6" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-display font-extrabold tracking-[-0.02em] text-ink ${
              hero ? "text-xl" : "text-lg"
            }`}
          >
            {project.title}
          </h3>
          {showFeatured && project.featured && <Tag accent>Featured</Tag>}
        </div>
        {project.subtitle.trim() !== "" && (
          <p className="mt-1.5 line-clamp-2 text-sm text-pretty text-muted">
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
      </div>
    </Link>
  );
}
