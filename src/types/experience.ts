import type { OrderedContent } from "./common";

/** Experience record (§15). Dates are user-facing strings, not timestamps. */
export interface Experience extends OrderedContent {
  id: string;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  technologies: string[];
  companyUrl?: string;
}

export type ExperienceInput = Omit<Experience, "id" | "createdAt" | "updatedAt" | "publishedAt">;
