import { useRouteLoaderData } from "react-router";

import { AboutSection } from "../../components/public/AboutSection";
import { CertificationsSection } from "../../components/public/CertificationsSection";
import { ContactSection } from "../../components/public/ContactSection";
import { EducationSection } from "../../components/public/EducationSection";
import { ExperienceSection } from "../../components/public/ExperienceSection";
import { Hero } from "../../components/public/Hero";
import { ProjectsSection } from "../../components/public/ProjectsSection";
import { SkillsSection } from "../../components/public/SkillsSection";
import type { PublicLayoutData } from "../../loaders/publicLoaders";

/**
 * Public homepage (§7) — every section renders from the shared layout loader
 * and only when its visibility flag and content both exist (§48). Empty or
 * disabled sections never render placeholders for content that isn't there.
 */
export default function Home() {
  const data = useRouteLoaderData("public") as PublicLayoutData;
  const { flags, profile } = data;

  return (
    <article className="space-y-14">
      {flags.hero && profile !== null ? (
        <Hero
          profile={profile}
          activeResume={data.activeResume}
          contactVisible={flags.contact}
        />
      ) : (
        <h1 className="sr-only">
          {profile !== null && profile.public.name.trim() !== ""
            ? profile.public.name
            : "Portfolio"}
        </h1>
      )}

      {flags.about && profile !== null && <AboutSection profile={profile} />}
      {flags.skills && <SkillsSection skills={data.skills} />}
      {flags.experience && <ExperienceSection experience={data.experience} />}
      {flags.education && <EducationSection education={data.education} />}
      {flags.certifications && (
        <CertificationsSection certifications={data.certifications} />
      )}
      {flags.projects && <ProjectsSection projects={data.projects} />}
      {flags.contact && (
        <ContactSection contactSettings={data.contactSettings} profile={profile} />
      )}
    </article>
  );
}
