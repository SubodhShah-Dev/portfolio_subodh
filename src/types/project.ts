import type { OrderedContent } from "./common";
import type { Clearable } from "./write";

/** Project record (§10). */
export interface Project extends OrderedContent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  techStack: string[];
  githubUrl?: string;
  liveDemoUrl?: string;
  thumbnailUrl?: string;
  /** Optional short muted video shown in the card media frame on hover (§10). */
  previewVideoUrl?: string;
  /** Public lifecycle chip on cards and the detail page — not the publish status. */
  lifecycle?: "shipped" | "in-progress" | "planned";
  /** Gallery screenshot URLs shown as a lightbox strip on the detail page. */
  images?: string[];
  date?: string;
  featured: boolean;
  features: string[];
  architecture?: string;
}

export type ProjectInput = Clearable<
  Omit<Project, "id" | "createdAt" | "updatedAt" | "publishedAt">
>;
