import type { LoaderFunctionArgs } from "react-router";

import type { PortfolioProfile } from "../types/profile";
import type { ContactSettings } from "../types/contact";
import type { Resume } from "../types/resume";
import type { SiteSettings, SectionVisibility } from "../types/settings";
import type { Certification } from "../types/certification";
import type { Education } from "../types/education";
import type { Experience } from "../types/experience";
import type { Project } from "../types/project";
import type { Skill } from "../types/skill";
import type { SocialLink } from "../types/socialLink";
import { getPublishedCertifications } from "../services/certificationService";
import { getContactSettings } from "../services/contactService";
import { getPublishedEducation } from "../services/educationService";
import { getPublishedExperience } from "../services/experienceService";
import { getActiveResume } from "../services/resumeService";
import { getProfile } from "../services/profileService";
import { getProjectById, getPublishedProjects } from "../services/projectService";
import { getSiteSettings } from "../services/settingsService";
import { getPublishedSkills } from "../services/skillService";
import { getPublishedSocialLinks } from "../services/socialLinkService";

export interface PublicLayoutData {
  profile: PortfolioProfile | null;
  activeResume: Resume | null;
  socialLinks: SocialLink[];
  contactSettings: ContactSettings | null;
  siteEnabled: boolean;
  siteTitle: string | null;
  siteDescription: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerText: string | null;
  /** Visibility combined with actual content — only truthy flags render (§48). */
  flags: SectionVisibility;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
}

function hasText(value: string | null | undefined): boolean {
  return value !== undefined && value !== null && value.trim() !== "";
}

function computeFlags(input: {
  profile: PortfolioProfile | null;
  settings: SiteSettings | null;
  contactSettings: ContactSettings | null;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
}): SectionVisibility {
  const enabled = input.settings?.sections;
  const visible = (section: keyof SectionVisibility): boolean =>
    enabled === undefined || enabled[section];

  const contactEnabled =
    visible("contact") && (input.contactSettings?.enabled ?? true);

  return {
    hero:
      visible("hero") &&
      input.profile !== null &&
      hasText(input.profile.public.name),
    about:
      visible("about") && input.profile !== null && hasText(input.profile.public.bio),
    skills: visible("skills") && input.skills.length > 0,
    projects: visible("projects") && input.projects.length > 0,
    experience: visible("experience") && input.experience.length > 0,
    education: visible("education") && input.education.length > 0,
    certifications: visible("certifications") && input.certifications.length > 0,
    contact: contactEnabled,
  };
}

/**
 * Loads every published content slice the public site needs (§6).
 *
 * All reads run in parallel through the shared cache, so the layout, the
 * homepage, and project routes never duplicate Firestore traffic.
 */
export async function publicLayoutLoader(): Promise<PublicLayoutData> {
  const [
    profile,
    activeResume,
    socialLinks,
    contactSettings,
    settings,
    skills,
    experience,
    education,
    certifications,
    projects,
  ] = await Promise.all([
    getProfile(),
    getActiveResume(),
    getPublishedSocialLinks(),
    getContactSettings(),
    getSiteSettings(),
    getPublishedSkills(),
    getPublishedExperience(),
    getPublishedEducation(),
    getPublishedCertifications(),
    getPublishedProjects(),
  ]);

  const siteEnabled = settings?.enabled ?? true;

  return {
    profile,
    activeResume,
    socialLinks,
    contactSettings,
    siteEnabled,
    siteTitle: settings?.siteTitle ?? null,
    siteDescription: settings?.siteDescription ?? null,
    logoUrl: settings?.logoUrl ?? null,
    faviconUrl: settings?.faviconUrl ?? null,
    footerText: settings?.footerText ?? null,
    flags: computeFlags({ profile, settings, contactSettings, skills, experience, education, certifications, projects }),
    skills,
    experience,
    education,
    certifications,
    projects,
  };
}

/**
 * Single project for /projects/:id (§14, §53). Missing, draft, and archived
 * ids all resolve to null — the page renders Not Found without leaking
 * whether the project exists.
 */
export async function projectLoader({
  params,
}: LoaderFunctionArgs): Promise<{ project: Project | null }> {
  const id = params.id ?? "";
  if (id === "") return { project: null };
  return { project: await getProjectById(id) };
}
