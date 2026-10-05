import type { OrderedContent } from "./common";

/** Education record (§16). */
export interface Education extends OrderedContent {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  institutionUrl?: string;
}

export type EducationInput = Omit<Education, "id" | "createdAt" | "updatedAt" | "publishedAt">;
