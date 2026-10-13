import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import type { Education } from "../../types/education";
import type { Experience } from "../../types/experience";

import { Section } from "./Section";

interface WorkEducationSectionProps {
  experience: Experience[];
  education: Education[];
  index?: number;
}

type TabKey = "work" | "education";

const FILLER_WORDS = new Set(["of", "the", "and", "for", "de", "la"]);

function initials(value: string): string {
  const words = value
    .split(/\s+/)
    .filter((word) => word.trim() !== "" && !FILLER_WORDS.has(word.toLowerCase()));
  const picked = words.length > 0 ? words : value.trim().split(/\s+/);
  return picked
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function TimelineLogo({ src, name }: { src?: string; name: string }) {
  if (src !== undefined && src.trim() !== "") {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="relative z-10 size-11 shrink-0 rounded-full border border-hairline bg-white object-contain p-1.5 sm:size-12"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface font-meta text-xs text-ink sm:size-12"
    >
      {initials(name)}
    </span>
  );
}

function DateRange({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate?: string;
}) {
  return (
    <p className="shrink-0 font-meta text-[11px] text-muted tabular-nums">
      {startDate} – {endDate ?? "Present"}
    </p>
  );
}

/**
 * Work history and education as one tabbed timeline section (§15–16).
 * The tablist hides when only one list has entries; the timeline is a
 * hairline vertical rule with circular logo (or initials) badges.
 */
export function WorkEducationSection({
  experience,
  education,
  index,
}: WorkEducationSectionProps) {
  const hasWork = experience.length > 0;
  const hasEducation = education.length > 0;
  const [active, setActive] = useState<TabKey>(hasWork ? "work" : "education");
  const baseId = useId();
  const workTabRef = useRef<HTMLButtonElement>(null);
  const educationTabRef = useRef<HTMLButtonElement>(null);
  const showTabs = hasWork && hasEducation;

  const select = (next: TabKey) => {
    setActive(next);
    (next === "work" ? workTabRef : educationTabRef).current?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!showTabs) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      select(active === "work" ? "education" : "work");
    }
  };

  const tabClass = (isSelected: boolean): string =>
    [
      "flex-1 rounded-full border-2 px-4 py-2 font-meta text-[11px] uppercase tracking-[0.12em] transition-colors",
      isSelected
        ? "border-ink bg-ink text-canvas"
        : "border-hairline text-muted hover:border-ink hover:text-ink",
    ].join(" ");

  return (
    <Section id="experience" title="Experience &amp; Education" index={index}>
      {showTabs && (
        <div
          role="tablist"
          aria-label="Experience and education"
          onKeyDown={onTabKeyDown}
          className="mb-8 flex max-w-md gap-1.5 rounded-full border-2 border-ink bg-surface p-1.5"
        >
          <button
            type="button"
            role="tab"
            id={`${baseId}-work-tab`}
            aria-selected={active === "work"}
            aria-controls={`${baseId}-work-panel`}
            tabIndex={active === "work" ? 0 : -1}
            ref={workTabRef}
            onClick={() => select("work")}
            className={tabClass(active === "work")}
          >
            Experience
          </button>
          <button
            type="button"
            role="tab"
            id={`${baseId}-education-tab`}
            aria-selected={active === "education"}
            aria-controls={`${baseId}-education-panel`}
            tabIndex={active === "education" ? 0 : -1}
            ref={educationTabRef}
            onClick={() => select("education")}
            className={tabClass(active === "education")}
          >
            Education
          </button>
        </div>
      )}

      {(showTabs ? active === "work" : hasWork) && (
        <div
          role={showTabs ? "tabpanel" : undefined}
          id={showTabs ? `${baseId}-work-panel` : undefined}
          aria-labelledby={showTabs ? `${baseId}-work-tab` : undefined}
          tabIndex={showTabs ? 0 : undefined}
          className="relative overflow-hidden rounded-2xl border border-hairline"
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-[2.375rem] w-px bg-hairline sm:left-[2.75rem]"
          />
          <ol className="relative p-4 sm:p-5">
            {experience.map((entry) => (
              <li key={entry.id} className="flex gap-4 pb-8 last:pb-0 sm:gap-5">
                <TimelineLogo src={entry.companyLogo} name={entry.company} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold tracking-[-0.01em] text-ink">
                    {entry.companyUrl !== undefined &&
                    entry.companyUrl.trim() !== "" ? (
                      <a
                        href={entry.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {entry.company}
                      </a>
                    ) : (
                      entry.company
                    )}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm text-signal-deep">{entry.role}</p>
                    <DateRange
                      startDate={entry.startDate}
                      endDate={entry.endDate}
                    />
                  </div>
                  {entry.location !== undefined &&
                    entry.location.trim() !== "" && (
                      <p className="mt-1 font-meta text-xs text-muted">
                        {entry.location}
                      </p>
                    )}
                  {entry.description.trim() !== "" && (
                    <p className="mt-2 max-w-2xl whitespace-pre-wrap text-pretty text-sm leading-7 text-muted">
                      {entry.description}
                    </p>
                  )}
                  {entry.technologies.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {entry.technologies.map((technology) => (
                        <li
                          key={technology}
                          className="border border-hairline px-2.5 py-0.5 font-meta text-xs text-muted"
                        >
                          {technology}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {(showTabs ? active === "education" : hasEducation) && (
        <div
          role={showTabs ? "tabpanel" : undefined}
          id={showTabs ? `${baseId}-education-panel` : undefined}
          aria-labelledby={showTabs ? `${baseId}-education-tab` : undefined}
          tabIndex={showTabs ? 0 : undefined}
          className="relative overflow-hidden rounded-2xl border border-hairline"
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-[2.375rem] w-px bg-hairline sm:left-[2.75rem]"
          />
          <ol className="relative p-4 sm:p-5">
            {education.map((entry) => (
              <li key={entry.id} className="flex gap-4 pb-8 last:pb-0 sm:gap-5">
                <TimelineLogo
                  src={entry.institutionLogo}
                  name={entry.institution}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold tracking-[-0.01em] text-ink">
                    {entry.institutionUrl !== undefined &&
                    entry.institutionUrl.trim() !== "" ? (
                      <a
                        href={entry.institutionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {entry.institution}
                      </a>
                    ) : (
                      entry.institution
                    )}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm text-signal-deep">
                      {entry.degree}
                      {entry.field !== undefined && entry.field.trim() !== ""
                        ? ` · ${entry.field}`
                        : ""}
                    </p>
                    <DateRange
                      startDate={entry.startDate}
                      endDate={entry.endDate}
                    />
                  </div>
                  {entry.description !== undefined &&
                    entry.description.trim() !== "" && (
                      <p className="mt-2 max-w-2xl whitespace-pre-wrap text-pretty text-sm leading-7 text-muted">
                        {entry.description}
                      </p>
                    )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Section>
  );
}
