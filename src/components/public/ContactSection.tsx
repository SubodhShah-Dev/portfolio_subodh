import type { ContactSettings } from "../../types/contact";
import type { PortfolioProfile } from "../../types/profile";
import { ContactForm } from "./ContactForm";
import { Section } from "./Section";

interface ContactSectionProps {
  contactSettings: ContactSettings | null;
  profile: PortfolioProfile | null;
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
export function ContactSection({ contactSettings, profile }: ContactSectionProps) {
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
    <Section id="contact" title={title} description={description}>
      <div className="grid gap-8 lg:grid-cols-2">
        <ul className="space-y-3 text-sm">
          {email !== undefined && (
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
          {phone !== undefined && (
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
          {location !== undefined && (
            <li>
              <span className="text-slate-500">Location: </span>
              <span className="text-slate-300">{location}</span>
            </li>
          )}
        </ul>
        <ContactForm />
      </div>
    </Section>
  );
}
