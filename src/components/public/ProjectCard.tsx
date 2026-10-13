import { ArrowUpRight, GitBranch } from "lucide-react";
import { Link } from "react-router";

import { LifecycleChip } from "./LifecycleChip";
import { ProjectMedia } from "./ProjectMedia";
import { Tag } from "./Tag";
import type { Project } from "../../types/project";

interface ProjectCardProps {
  project: Project;
  /** Shows the Featured badge (lists only). */
  showFeatured?: boolean;
}

/**
 * Reusable project card (§13) — pop frame with an inset media frame (image
 * or hover-play video preview), title/date/status row, clamped description,
 * filled tech chips, and Source / Live demo buttons above a stretched title
 * link so the whole card reads as one target while the buttons stay usable.
 */
export function ProjectCard({ project, showFeatured = true }: ProjectCardProps) {
  const hasGithub =
    project.githubUrl !== undefined && project.githubUrl.trim() !== "";
  const hasDemo =
    project.liveDemoUrl !== undefined && project.liveDemoUrl.trim() !== "";
  const firstParagraph =
    project.description.trim() !== ""
      ? (project.description.split(/\n\s*\n/)[0] ?? "").trim()
      : "";

  return (
    <article className="pop-card pop-card-link group relative flex h-full flex-col p-4 sm:p-5">
      <ProjectMedia
        imageUrl={project.thumbnailUrl}
        videoUrl={project.previewVideoUrl}
        alt=""
      />
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">
            <Link
              to={`/projects/${project.id}`}
              className="rounded underline-offset-4 after:absolute after:inset-0 hover:underline"
            >
              {project.title}
            </Link>
          </h3>
          {project.date !== undefined && project.date.trim() !== "" && (
            <span className="font-meta text-xs text-muted tabular-nums">
              {project.date}
            </span>
          )}
          <LifecycleChip lifecycle={project.lifecycle} />
          {showFeatured && project.featured && <Tag accent>Featured</Tag>}
        </div>
        {project.subtitle.trim() !== "" && (
          <p className="mt-1 text-sm text-muted">{project.subtitle}</p>
        )}
        {firstParagraph !== "" && (
          <p className="mt-2 line-clamp-3 text-pretty text-sm leading-relaxed text-muted">
            {firstParagraph}
          </p>
        )}
        {project.techStack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.techStack.map((technology) => (
              <li
                key={technology}
                className="rounded-md border border-hairline bg-surface px-2.5 py-1 font-meta text-xs text-muted"
              >
                {technology}
              </li>
            ))}
          </ul>
        )}
        {(hasGithub || hasDemo) && (
          <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-5">
            {hasGithub && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-primary cta-sm"
              >
                Source
                <GitBranch aria-hidden="true" className="size-3.5" />
              </a>
            )}
            {hasDemo && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-ghost cta-sm"
              >
                Live demo
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
