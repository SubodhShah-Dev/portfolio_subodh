import type { OrderedContent } from "./common";
import type { Clearable } from "./write";

/** Education record (§16). */
export interface Education extends OrderedContent {
  id: string;
  institution: string;
  /** Optional institution logo shown in the timeline circle (§16). */
  institutionLogo?: string;
  degree: string;
  field?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  institutionUrl?: string;
}

export type EducationInput = Clearable<
  Omit<Education, "id" | "createdAt" | "updatedAt" | "publishedAt">
>;
