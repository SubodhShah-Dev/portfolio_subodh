import type { OrderedContent } from "./common";

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
  /** Gallery screenshot URLs shown as a lightbox strip on the detail page. */
  images?: string[];
  date?: string;
  featured: boolean;
  features: string[];
  architecture?: string;
}

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt" | "publishedAt">;
