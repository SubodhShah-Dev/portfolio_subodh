import type { ContactSettings } from "../../types/contact";
import type { PortfolioProfile } from "../../types/profile";
import { ContactForm } from "./ContactForm";
import { Section } from "./Section";

interface ContactSectionProps {
  contactSettings: ContactSettings | null;
  profile: PortfolioProfile | null;
  index?: number;
}

function firstNonBlank(
  primary: string | undefined,
  fallback: string | undefined,
): string | undefined {
  if (primary !== undefined && primary.trim() !== "") return primary;
  if (fallback !== undefined && fallback.trim() !== "") return fallback;
  return undefined;
}

/**
 * Contact section (§19) — configurable copy with values falling back to the
 * profile's published contact identity; only supplied fields render.
 */
export function ContactSection({
  contactSettings,
  profile,
  index,
}: ContactSectionProps) {
  const title =
    contactSettings?.title !== undefined && contactSettings.title.trim() !== ""
      ? contactSettings.title
      : "Contact";
  const description =
    contactSettings?.description !== undefined &&
    contactSettings.description.trim() !== ""
      ? contactSettings.description
      : undefined;

  const email = firstNonBlank(contactSettings?.email, profile?.contact.email);
  const phone = firstNonBlank(contactSettings?.phone, profile?.contact.phone);
  const location = firstNonBlank(
    contactSettings?.location,
    profile?.public.location,
  );

  return (
    <Section id="contact" title={title} description={description} index={index}>
      <div className="grid gap-10 lg:grid-cols-2">
        <ul className="space-y-5 font-meta text-sm">
          {email !== undefined && (
            <li className="flex items-baseline gap-3">
              <span className="text-slate-400">Email</span>
              <a
                href={`mailto:${email}`}
                className="break-all text-emerald-400 underline-offset-4 hover:underline"
              >
                {email}
              </a>
            </li>
          )}
          {phone !== undefined && (
            <li className="flex items-baseline gap-3">
              <span className="text-slate-400">Phone</span>
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="text-emerald-400 underline-offset-4 hover:underline"
              >
                {phone}
              </a>
            </li>
          )}
          {location !== undefined && (
            <li className="flex items-baseline gap-3">
              <span className="text-slate-400">Based in</span>
              <span className="text-slate-300">{location}</span>
            </li>
          )}
        </ul>
        <ContactForm />
      </div>
    </Section>
  );
}
