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
      <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="max-w-2xl text-sm leading-7 text-slate-400">
              {paragraph}
            </p>
          ))}
          {(hasEmail || hasPhone || hasLocation) && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
              {hasEmail && (
                <li>
                  <span className="text-slate-500">Email: </span>
                  <a
                    href={`mailto:${email}`}
                    className="text-emerald-400 hover:underline"
                  >
                    {email}
                  </a>
                </li>
              )}
              {hasPhone && (
                <li>
                  <span className="text-slate-500">Phone: </span>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="text-emerald-400 hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {hasLocation && (
                <li>
                  <span className="text-slate-500">Location: </span>
                  <span className="text-slate-300">{location}</span>
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
            className="mx-auto size-36 rounded-2xl border border-slate-800 object-cover sm:mx-0"
          />
        )}
      </div>
    </Section>
  );
}
