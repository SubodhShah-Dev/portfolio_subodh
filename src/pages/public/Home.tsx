import { useRouteLoaderData } from "react-router";

import { AboutSection } from "../../components/public/AboutSection";
import { CertificationsSection } from "../../components/public/CertificationsSection";
import { ContactSection } from "../../components/public/ContactSection";
import { Hero } from "../../components/public/Hero";
import { ProjectsSection } from "../../components/public/ProjectsSection";
import { SkillsSection } from "../../components/public/SkillsSection";
import { WorkEducationSection } from "../../components/public/WorkEducationSection";
import type { PublicLayoutData } from "../../loaders/publicLoaders";
import type { SectionVisibility } from "../../types/settings";

/** Numbering follows render order — hidden sections never leave gaps. */
const SECTION_ORDER = [
  "about",
  "skills",
  "experience",
  "certifications",
  "projects",
  "contact",
] satisfies readonly (keyof SectionVisibility)[];

type SectionKey = (typeof SECTION_ORDER)[number];

/**
 * Public homepage (§7) — every section renders from the shared layout loader
 * and only when its visibility flag and content both exist (§48). Empty or
 * disabled sections never render placeholders for content that isn't there.
 */
export default function Home() {
  const data = useRouteLoaderData("public") as PublicLayoutData;
  const { flags, profile } = data;

  // The combined Work & Education section shows when either list has content
  // or its own flag is on — the tablist inside hides the empty side.
  const sectionVisible = (key: SectionKey): boolean =>
    key === "experience"
      ? flags.experience || flags.education
      : flags[key];
  const rendered = SECTION_ORDER.filter(sectionVisible);
  const numberOf = (key: SectionKey): number => rendered.indexOf(key) + 1;

  return (
    <article>
      {flags.hero && profile !== null ? (
        <Hero
          profile={profile}
          contactVisible={flags.contact}
          socialLinks={data.socialLinks}
          resumeDownloadUrl={data.activeResume?.downloadUrl ?? null}
        />
      ) : (
        <h1 className="sr-only">
          {profile !== null && profile.public.name.trim() !== ""
            ? profile.public.name
            : "Portfolio"}
        </h1>
      )}

      {flags.about && profile !== null && (
        <AboutSection profile={profile} index={numberOf("about")} />
      )}
      {flags.skills && (
        <SkillsSection skills={data.skills} index={numberOf("skills")} />
      )}
      {(flags.experience || flags.education) && (
        <WorkEducationSection
          experience={data.experience}
          education={data.education}
          index={numberOf("experience")}
        />
      )}
      {flags.certifications && (
        <CertificationsSection
          certifications={data.certifications}
          index={numberOf("certifications")}
        />
      )}
      {flags.projects && (
        <ProjectsSection projects={data.projects} index={numberOf("projects")} />
      )}
      {flags.contact && (
        <ContactSection
          contactSettings={data.contactSettings}
          profile={profile}
          index={numberOf("contact")}
        />
      )}
    </article>
  );
}
