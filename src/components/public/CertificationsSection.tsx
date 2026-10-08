import type { Certification } from "../../types/certification";

import { Section } from "./Section";

interface CertificationsSectionProps {
  certifications: Certification[];
  index?: number;
}

/** Certification cards — credential links only when a URL exists (§17). */
export function CertificationsSection({
  certifications,
  index,
}: CertificationsSectionProps) {
  return (
    <Section id="certifications" title="Certifications" index={index} tone="pink">
      <ul className="grid gap-5 sm:grid-cols-2">
        {certifications.map((entry) => (
          <li key={entry.id} className="pop-card p-5">
            <h3 className="text-sm font-semibold text-ink">{entry.title}</h3>
            <p className="mt-1 text-sm text-signal-deep">{entry.issuer}</p>
            {entry.issueDate !== undefined && entry.issueDate.trim() !== "" && (
              <p className="mt-1 font-meta text-xs text-muted tabular-nums">
                {entry.issueDate}
              </p>
            )}
            {entry.description !== undefined && entry.description.trim() !== "" && (
              <p className="mt-2 text-pretty text-sm leading-6 text-muted">
                {entry.description}
              </p>
            )}
            {entry.credentialUrl !== undefined && entry.credentialUrl.trim() !== "" && (
              <a
                href={entry.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-meta text-xs text-signal-deep underline-offset-4 hover:underline"
              >
                View credential →
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
