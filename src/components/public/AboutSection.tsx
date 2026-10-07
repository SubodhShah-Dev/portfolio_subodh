import type { PortfolioProfile } from "../../types/profile";

import { Section } from "./Section";

interface AboutSectionProps {
  profile: PortfolioProfile;
  index?: number;
}

/** About section — bio plus only the contact details actually supplied (§8). */
export function AboutSection({ profile, index }: AboutSectionProps) {
  const { bio, profileImageUrl, location } = profile.public;
  const paragraphs = bio.split(/\n{2,}/).map((entry) => entry.trim()).filter((entry) => entry !== "");
  const email = profile.contact.email;
  const phone = profile.contact.phone;
  const hasEmail = email !== undefined && email.trim() !== "";
  const hasPhone = phone !== undefined && phone.trim() !== "";
  const hasLocation = location !== undefined && location.trim() !== "";

  return (
    <Section id="about" title="About" index={index}>
      <div className="grid gap-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-5">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="max-w-2xl text-pretty text-base leading-8 text-ink"
            >
              {paragraph}
            </p>
          ))}
          {(hasEmail || hasPhone || hasLocation) && (
            <ul className="flex flex-wrap gap-x-8 gap-y-3 pt-3 font-meta text-sm">
              {hasEmail && (
                <li className="flex items-baseline gap-2">
                  <span className="text-muted">Email</span>
                  <a
                    href={`mailto:${email}`}
                    className="text-signal-deep underline-offset-4 hover:underline"
                  >
                    {email}
                  </a>
                </li>
              )}
              {hasPhone && (
                <li className="flex items-baseline gap-2">
                  <span className="text-muted">Phone</span>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="text-signal-deep underline-offset-4 hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {hasLocation && (
                <li className="flex items-baseline gap-2">
                  <span className="text-muted">Based in</span>
                  <span className="text-ink">{location}</span>
                </li>
              )}
            </ul>
          )}
        </div>
        {profileImageUrl !== undefined && profileImageUrl.trim() !== "" && (
          <img
            src={profileImageUrl}
            alt={`${profile.public.name} — profile`}
            loading="lazy"
            className="mx-auto size-44 border border-ink object-cover shadow-[8px_8px_0_0_var(--color-signal)] sm:mx-0"
          />
        )}
      </div>
    </Section>
  );
}
