import {
  useCallback,
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Tag } from "./Tag";
import { LifecycleChip } from "./LifecycleChip";
import { ProjectMedia } from "./ProjectMedia";
import type { Project } from "../../types/project";

interface ProjectShowcaseProps {
  projects: Project[];
}

/**
 * Homepage project showcase (§13) — swipeable embla carousel of framed
 * preview cards. Slides are plain links, never cloned or aria-hidden, so
 * every project stays reachable by keyboard and assistive tech; navigation
 * is drag + circle prev/next buttons + dots with aria-current, with a mono
 * position counter (decorative) and arrow-key support on the region.
 */
export function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi !== undefined) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Initial state already matches embla's startIndex (0); the listeners
  // below cover every later change, including reInits from slide swaps.
  useEffect(() => {
    if (emblaApi === undefined) return;
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (projects.length === 0) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      emblaApi?.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      emblaApi?.scrollNext();
    }
  };

  // Keep the focused link's slide in view when tabbing through the region.
  const handleFocusCapture = (event: FocusEvent<HTMLDivElement>): void => {
    if (emblaApi === undefined) return;
    const slide = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-showcase-slide]",
    );
    if (slide === null) return;
    const index = emblaApi.slideNodes().indexOf(slide);
    if (index !== -1) emblaApi.scrollTo(index);
  };

  return (
    <div
      role="region"
      aria-label="Projects showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocusCapture={handleFocusCapture}
    >
      <div ref={emblaRef} className="touch-pan-y overflow-hidden">
        <ul className="flex gap-4">
          {projects.map((project) => {
            const hasGithub =
              project.githubUrl !== undefined &&
              project.githubUrl.trim() !== "";
            const hasDemo =
              project.liveDemoUrl !== undefined &&
              project.liveDemoUrl.trim() !== "";
            const firstParagraph =
              project.description.trim() !== ""
                ? (project.description.split(/\n\s*\n/)[0] ?? "").trim()
                : "";
            return (
              <li
                key={project.id}
                data-showcase-slide=""
                className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_calc(50%_-_0.5rem)] lg:flex-[0_0_calc((100%_-_2rem)_/_3)]"
              >
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
                      {project.date !== undefined &&
                        project.date.trim() !== "" && (
                          <span className="font-meta text-xs text-muted tabular-nums">
                            {project.date}
                          </span>
                        )}
                      <LifecycleChip lifecycle={project.lifecycle} />
                      {project.featured && <Tag accent>Featured</Tag>}
                    </div>
                    {project.subtitle.trim() !== "" && (
                      <p className="mt-1 text-sm text-muted">
                        {project.subtitle}
                      </p>
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
                            className="rounded-md border border-hairline bg-raised px-2.5 py-1 font-meta text-xs text-muted"
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
                            className="inline-flex items-center rounded-full border-2 border-ink bg-ink px-3 py-1.5 font-meta text-[11px] uppercase tracking-[0.1em] text-canvas transition-colors hover:border-signal hover:bg-signal hover:text-on-signal"
                          >
                            Source
                          </a>
                        )}
                        {hasDemo && (
                          <a
                            href={project.liveDemoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full border-2 border-ink bg-raised px-3 py-1.5 font-meta text-[11px] uppercase tracking-[0.1em] text-ink transition-colors hover:border-signal hover:text-signal"
                          >
                            Live demo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p
          aria-hidden="true"
          className="font-meta text-xs text-muted tabular-nums"
        >
          {String(selected + 1).padStart(2, "0")} /{" "}
          {String(projects.length).padStart(2, "0")}
        </p>

        <div className="flex items-center gap-2">
          {projects.map((project, index) => (
            <button
              key={project.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selected ? "true" : undefined}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`size-2.5 cursor-pointer rounded-full border-2 transition-colors ${
                index === selected
                  ? "border-signal bg-signal"
                  : "border-ink hover:bg-ink"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => emblaApi?.scrollPrev()}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-raised text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-signal hover:bg-signal hover:text-on-signal"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => emblaApi?.scrollNext()}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-raised text-ink transition-all duration-150 hover:-translate-y-0.5 hover:border-signal hover:bg-signal hover:text-on-signal"
          >
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
