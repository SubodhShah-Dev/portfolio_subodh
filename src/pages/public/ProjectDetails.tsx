import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { ArrowDown, ArrowUpRight, GitBranch } from "lucide-react";

import NotFound from "./NotFound";
import { Lightbox } from "../../components/public/Lightbox";
import { LifecycleChip } from "../../components/public/LifecycleChip";
import { Tag } from "../../components/public/Tag";
import type { Project } from "../../types/project";

/**
 * Project detail route (/projects/:id) (§14, §53).
 *
 * Missing, draft, and archived ids all resolve to `project: null` from the
 * loader — this page renders the same Not Found state for each, without
 * leaking whether the project exists.
 */
export default function ProjectDetails() {
  const { project } = useLoaderData<{ project: Project | null }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (project === null) return <NotFound />;

  const hasLiveDemo = project.liveDemoUrl !== undefined && project.liveDemoUrl.trim() !== "";
  const hasGithub = project.githubUrl !== undefined && project.githubUrl.trim() !== "";
  const hasThumb =
    project.thumbnailUrl !== undefined && project.thumbnailUrl.trim() !== "";
  const hasPreviewVideo =
    project.previewVideoUrl !== undefined && project.previewVideoUrl.trim() !== "";
  const gallery = (project.images ?? []).filter((url) => url.trim() !== "");
  const paragraphs =
    project.description.trim() !== ""
      ? project.description
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter((paragraph) => paragraph !== "")
      : [];
  const architectureSteps =
    project.architecture !== undefined
      ? project.architecture
          .split(/\n+/)
          .map((step) => step.trim())
          .filter((step) => step !== "")
      : [];

  return (
    <article className="space-y-10">
      <Link
        to="/projects"
        className="inline-block font-meta text-sm text-muted transition-colors hover:text-signal"
      >
        ← Back to projects
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
            {project.title}
          </h1>
          <LifecycleChip lifecycle={project.lifecycle} />
          {project.featured && <Tag accent>Featured</Tag>}
          {project.date !== undefined && project.date.trim() !== "" && (
            <span className="font-meta text-sm text-muted tabular-nums">
              {project.date}
            </span>
          )}
        </div>
        {project.subtitle.trim() !== "" && (
          <p className="max-w-3xl text-xl text-pretty leading-relaxed text-muted">
            {project.subtitle}
          </p>
        )}
        {(hasLiveDemo || hasGithub) && (
          <div className="flex flex-wrap gap-4 pt-1">
            {hasLiveDemo && (
              <a
                className="cta-link"
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Live demo
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            )}
            {hasGithub && (
              <a
                className="cta-link"
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source code
                <GitBranch aria-hidden="true" className="size-4" />
              </a>
            )}
          </div>
        )}
      </header>

      {hasPreviewVideo ? (
          <div className="aspect-video w-full overflow-hidden rounded-chunk border-2 border-ink bg-surface-hover">
          <video
            src={project.previewVideoUrl}
            poster={hasThumb ? project.thumbnailUrl : undefined}
            controls
            playsInline
            className="h-full w-full object-cover"
          >
            <track kind="captions" />
          </video>
        </div>
      ) : (
        hasThumb && (
        <div className="aspect-video w-full overflow-hidden rounded-chunk border-2 border-ink bg-surface-hover">
            <img
              src={project.thumbnailUrl}
              alt={`Screenshot of ${project.title}`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        )
      )}

      {project.techStack.length > 0 && (
        <section aria-labelledby="tech-heading">
          <h2
            id="tech-heading"
            className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
          >
            Tech stack
          </h2>
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
        </section>
      )}

      {paragraphs.length > 0 && (
        <section aria-labelledby="overview-heading">
          <h2
            id="overview-heading"
            className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
          >
            Overview
          </h2>
          <div className="mt-4 max-w-3xl space-y-4 text-pretty text-base leading-8 text-ink">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {project.features.length > 0 && (
        <section aria-labelledby="features-heading">
          <h2
            id="features-heading"
            className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
          >
            Features
          </h2>
          <ul className="mt-4 max-w-3xl space-y-2.5">
            {project.features.map((feature) => (
              <li
                key={feature}
                className="flex gap-3 text-pretty text-sm leading-7 text-muted"
              >
                <span aria-hidden="true" className="text-signal">
                  →
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </section>
      )}

      {architectureSteps.length > 0 && (
        <section aria-labelledby="architecture-heading">
          <h2
            id="architecture-heading"
            className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
          >
            Architecture
          </h2>
          <ol className="mx-auto mt-4 flex max-w-sm flex-col items-center">
            {architectureSteps.map((step, position) => (
              <li
                key={`${position}-${step}`}
                className="flex w-full flex-col items-center"
              >
                <span className="w-full border-2 border-ink bg-surface px-4 py-2 text-center font-meta text-xs text-ink">
                  {step}
                </span>
                {position < architectureSteps.length - 1 && (
                  <ArrowDown
                    aria-hidden="true"
                    className="my-1.5 size-4 text-muted"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {gallery.length > 0 && (
        <section aria-label="Gallery">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink">
            Screenshots
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {gallery.map((url, position) => (
              <li key={`${url}-${position}`}>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(position)}
                  aria-label={`Open gallery image ${position + 1}`}
                  className="group block aspect-video w-full cursor-pointer overflow-hidden rounded-chunk border-2 border-ink bg-surface-hover transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <img
                    src={url}
                    alt={`${project.title} screenshot ${position + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lightboxIndex !== null && gallery.length > 0 && (
        <Lightbox
          images={gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </article>
  );
}
