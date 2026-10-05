import type { Education } from "../../types/education";

import { Section } from "./Section";

interface EducationSectionProps {
  education: Education[];
}

/** Education history — degrees rendered only from stored fields (§16). */
export function EducationSection({ education }: EducationSectionProps) {
  return (
    <Section id="education" title="Education">
      <ul className="space-y-4">
        {education.map((entry) => (
          <li key={entry.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  {entry.institutionUrl !== undefined && entry.institutionUrl.trim() !== "" ? (
                    <a
                      href={entry.institutionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {entry.institution}
                    </a>
                  ) : (
                    entry.institution
                  )}
                </h3>
                <p className="mt-1 text-sm text-emerald-400">
                  {entry.degree}
                  {entry.field !== undefined && entry.field.trim() !== ""
                    ? ` · ${entry.field}`
                    : ""}
                </p>
              </div>
              <p className="font-mono text-xs text-slate-500">
                {entry.startDate} – {entry.endDate ?? "Present"}
              </p>
            </div>
            {entry.description !== undefined && entry.description.trim() !== "" && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                {entry.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
