import { Timestamp } from "firebase/firestore";

import type { PublicLayoutData } from "../../src/loaders/publicLoaders";
import type { PortfolioProfile } from "../../src/types/profile";
import type { Certification } from "../../src/types/certification";
import type { Education } from "../../src/types/education";
import type { Experience } from "../../src/types/experience";
import type { Project } from "../../src/types/project";
import type { Skill } from "../../src/types/skill";
import type { SocialLink } from "../../src/types/socialLink";
import type { SectionVisibility } from "../../src/types/settings";

/**
 * Test fixtures for the public data layer — every builder starts from an
 * honest empty state and only adds what each test explicitly overrides.
 */

const now = Timestamp.now();

const HIDDEN_FLAGS: SectionVisibility = {
  hero: false,
  about: false,
  skills: false,
  projects: false,
  experience: false,
  education: false,
  certifications: false,
  contact: false,
};

export function makeLayoutData(
  overrides: Partial<PublicLayoutData> = {},
): PublicLayoutData {
  return {
    profile: null,
    activeResume: null,
    socialLinks: [],
    contactSettings: null,
    siteEnabled: true,
    siteTitle: null,
    siteDescription: null,
    logoUrl: null,
    faviconUrl: null,
    footerText: null,
    flags: { ...HIDDEN_FLAGS },
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    ...overrides,
  };
}

export function makeProfile(
  overrides: Partial<PortfolioProfile> = {},
): PortfolioProfile {
  return {
    public: {
      id: "public",
      name: "Ada Lovelace",
      role: "Software Engineer",
      headline: "Analytical engines and beyond",
      bio: "Builder of things.",
      ...overrides.public,
    },
    contact: { id: "contact", ...overrides.contact },
  };
}

export function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "skill-1",
    category: "Languages",
    name: "TypeScript",
    status: "published",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: "exp-1",
    company: "Analytical Engines Ltd",
    role: "Engineer",
    description: "Designed computing engines.",
    startDate: "2020",
    endDate: "2023",
    technologies: ["TypeScript"],
    status: "published",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeEducation(overrides: Partial<Education> = {}): Education {
  return {
    id: "edu-1",
    institution: "University of London",
    degree: "BSc",
    startDate: "2016",
    endDate: "2019",
    status: "published",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeCertification(overrides: Partial<Certification> = {}): Certification {
  return {
    id: "cert-1",
    title: "Cloud Practitioner",
    issuer: "Example Cloud",
    status: "published",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    title: "Sample project",
    subtitle: "A test fixture",
    description: "Fixture description.",
    techStack: ["TypeScript"],
    featured: false,
    features: ["Feature one"],
    status: "published",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function makeSocialLink(overrides: Partial<SocialLink> = {}): SocialLink {
  return {
    id: "link-1",
    platform: "GitHub",
    label: "GitHub",
    url: "https://github.com/example",
    status: "published",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export { HIDDEN_FLAGS };
