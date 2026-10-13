import {
  useCallback,
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ProjectCard } from "./ProjectCard";
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
      <div
        ref={emblaRef}
        className="cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
      >
        <ul className="flex gap-4">
          {projects.map((project) => (
            <li
              key={project.id}
              data-showcase-slide=""
              className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_calc(50%_-_0.5rem)] lg:flex-[0_0_calc((100%_-_2rem)_/_3)]"
            >
              <ProjectCard project={project} />
            </li>
          ))}
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
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-surface text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-signal hover:bg-signal hover:text-on-signal"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => emblaApi?.scrollNext()}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-surface text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-signal hover:bg-signal hover:text-on-signal"
          >
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
