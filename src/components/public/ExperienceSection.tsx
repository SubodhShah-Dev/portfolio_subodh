import type { Experience } from "../../types/experience";

import { Section } from "./Section";

interface ExperienceSectionProps {
  experience: Experience[];
  index?: number;
}

/**
 * Work history as hairline rows — editorial list, not cards (§15).
 * Dates are user-facing strings and render in mono, tabular-aligned.
 */
export function ExperienceSection({ experience, index }: ExperienceSectionProps) {
  return (
    <Section id="experience" title="Experience" index={index}>
      <ul>
        {experience.map((entry) => (
          <li
            key={entry.id}
            className="grid gap-3 border-b border-slate-800/60 py-6 last:border-b-0 md:grid-cols-[1fr_auto] md:gap-10"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-xl font-semibold text-slate-100">
                  {entry.role}
                </h3>
                <p className="text-sm text-emerald-400">
                  {entry.companyUrl !== undefined && entry.companyUrl.trim() !== "" ? (
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
                </p>
              </div>
              {entry.location !== undefined && entry.location.trim() !== "" && (
                <p className="mt-1 font-meta text-xs text-slate-400">
                  {entry.location}
                </p>
              )}
              {entry.description.trim() !== "" && (
                <p className="mt-3 max-w-2xl whitespace-pre-wrap text-pretty text-sm leading-7 text-slate-400">
                  {entry.description}
                </p>
              )}
              {entry.technologies.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {entry.technologies.map((technology) => (
                    <li
                      key={technology}
                      className="rounded-full border border-slate-800 bg-slate-900/50 px-2.5 py-0.5 font-meta text-xs text-slate-400"
                    >
                      {technology}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="font-meta text-xs whitespace-nowrap text-slate-400 tabular-nums md:text-right">
              {entry.startDate} – {entry.endDate ?? "Present"}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
