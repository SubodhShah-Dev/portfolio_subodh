import type { Education } from "../../types/education";

import { Section } from "./Section";

interface EducationSectionProps {
  education: Education[];
  index?: number;
}

/** Education history as hairline rows — degrees rendered only from stored fields (§16). */
export function EducationSection({ education, index }: EducationSectionProps) {
  return (
    <Section id="education" title="Education" index={index}>
      <ul>
        {education.map((entry) => (
          <li
            key={entry.id}
            className="grid gap-3 border-b border-hairline py-6 last:border-b-0 md:grid-cols-[1fr_auto] md:gap-10"
          >
            <div className="min-w-0">
              <h3 className="text-xl font-bold tracking-[-0.01em] text-ink">
                {entry.institutionUrl !== undefined && entry.institutionUrl.trim() !== "" ? (
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
              <p className="mt-1 text-sm text-signal-deep">
                {entry.degree}
                {entry.field !== undefined && entry.field.trim() !== ""
                  ? ` · ${entry.field}`
                  : ""}
              </p>
              {entry.description !== undefined && entry.description.trim() !== "" && (
                <p className="mt-3 max-w-2xl whitespace-pre-wrap text-pretty text-sm leading-7 text-muted">
                  {entry.description}
                </p>
              )}
            </div>
            <p className="font-meta text-xs text-muted tabular-nums md:whitespace-nowrap md:text-right">
              {entry.startDate} – {entry.endDate ?? "Present"}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
