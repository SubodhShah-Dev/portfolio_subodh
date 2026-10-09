import type { PortfolioProfile } from "../../types/profile";
import { resolveProfileImages } from "../../utils/profileImages";

import { ProfileStack } from "./ProfileStack";
import { Section } from "./Section";

interface AboutSectionProps {
  profile: PortfolioProfile;
  index?: number;
}

/** About section — bio plus only the contact details actually supplied (§8). */
export function AboutSection({ profile, index }: AboutSectionProps) {
  const { bio, location } = profile.public;
  const imageUrls = resolveProfileImages(profile.public);
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
                  <span className="text-ink break-words">{location}</span>
                </li>
              )}
            </ul>
          )}
        </div>
        {imageUrls.length > 0 && (
          <div className="mx-auto sm:mx-0">
            <ProfileStack images={imageUrls} name={profile.public.name} />
          </div>
        )}
      </div>
    </Section>
  );
}
