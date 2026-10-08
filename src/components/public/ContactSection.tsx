import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

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
 * The email row carries a copy button with an inline confirmation toast.
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

  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    return () => {
      if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const copyEmail = (): void => {
    const clipboard = navigator.clipboard;
    if (email === undefined || clipboard === undefined) return;
    void clipboard.writeText(email).then(() => {
      setCopied(true);
      if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <Section id="contact" title={title} description={description} index={index}>
      <div className="grid gap-10 lg:grid-cols-2">
        <ul className="space-y-4 font-meta text-sm">
          {email !== undefined && (
            <li className="pop-card flex flex-wrap items-baseline gap-x-3 gap-y-2 px-4 py-3.5">
              <span className="text-muted">Email</span>
              <a
                href={`mailto:${email}`}
                className="break-all text-signal-deep underline-offset-4 hover:underline"
              >
                {email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="ml-auto cursor-pointer rounded-full border-2 border-ink px-2.5 py-0.5 font-meta text-[11px] tracking-[0.1em] text-ink uppercase transition-colors hover:bg-ink hover:text-canvas"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </li>
          )}
          {phone !== undefined && (
            <li className="pop-card flex items-baseline gap-3 px-4 py-3.5">
              <span className="text-muted">Phone</span>
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="text-signal-deep underline-offset-4 hover:underline"
              >
                {phone}
              </a>
            </li>
          )}
          {location !== undefined && (
            <li className="pop-card flex items-baseline gap-3 px-4 py-3.5">
              <span className="text-muted">Based in</span>
              <span className="text-ink">{location}</span>
            </li>
          )}
        </ul>
        <div className="lime-panel tone-band pop-card bg-lime p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>

      {copied && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 z-90 -translate-x-1/2 border-2 border-ink bg-ink px-4 py-2.5 font-meta text-xs tracking-[0.1em] text-canvas uppercase shadow-[5px_5px_0_0_var(--color-lime)]"
        >
          Email copied
        </motion.div>
      )}
    </Section>
  );
}
