import type { Experience } from "../../types/experience";

import { Section } from "./Section";

interface ExperienceSectionProps {
  experience: Experience[];
  index?: number;
}

/** Work history as stacked cards — dates are user-facing strings (§15). */
export function ExperienceSection({ experience, index }: ExperienceSectionProps) {
  return (
    <Section id="experience" title="Experience" index={index}>
      <ul className="space-y-4">
        {experience.map((entry) => (
          <li key={entry.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">{entry.role}</h3>
                <p className="mt-0.5 text-sm text-emerald-400">
                  {entry.companyUrl !== undefined && entry.companyUrl.trim() !== "" ? (
                    <a
                      href={entry.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {entry.company}
                    </a>
                  ) : (
                    entry.company
                  )}
                </p>
              </div>
              <p className="font-mono text-xs text-slate-500">
                {entry.startDate} – {entry.endDate ?? "Present"}
              </p>
            </div>
            {entry.location !== undefined && entry.location.trim() !== "" && (
              <p className="mt-1 text-xs text-slate-500">{entry.location}</p>
            )}
            {entry.description.trim() !== "" && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                {entry.description}
              </p>
            )}
            {entry.technologies.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {entry.technologies.map((technology) => (
                  <li
                    key={technology}
                    className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-0.5 text-xs text-slate-400"
                  >
                    {technology}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
