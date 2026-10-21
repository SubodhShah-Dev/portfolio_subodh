import type { Timestamp } from "firebase/firestore";

import type { Clearable } from "./write";

/** Which public homepage sections render (§48). */
export interface SectionVisibility {
  hero: boolean;
  about: boolean;
  skills: boolean;
  projects: boolean;
  experience: boolean;
  education: boolean;
  certifications: boolean;
  contact: boolean;
}

export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  hero: true,
  about: true,
  skills: true,
  projects: true,
  experience: true,
  education: true,
  certifications: true,
  contact: true,
};

/** Global website configuration (§47), stored at settings/main. */
export interface SiteSettings {
  id: string;
  siteTitle?: string;
  siteDescription?: string;
  /** Optional nav icon image; when absent the nav shows the SS monogram. */
  navIconUrl?: string;
  faviconUrl?: string;
  footerText?: string;
  sections: SectionVisibility;
  enabled: boolean;
  updatedAt: Timestamp;
}

export type SiteSettingsInput = Clearable<Omit<SiteSettings, "id" | "updatedAt">>;
