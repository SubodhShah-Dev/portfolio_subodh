import type { OrderedContent } from "./common";

/** Skill record (§9). Categories are data-driven, never hardcoded. */
export interface Skill extends OrderedContent {
  id: string;
  category: string;
  name: string;
  iconUrl?: string;
  proficiency?: number;
}

export type SkillInput = Omit<Skill, "id" | "createdAt" | "updatedAt" | "publishedAt">;

/** Distinct categories derived from stored skills for admin grouping/filters. */
export interface SkillCategory {
  name: string;
  count: number;
}
