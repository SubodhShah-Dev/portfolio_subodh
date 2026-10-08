import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { DEFAULT_SECTION_VISIBILITY } from "../types/settings";
import { createAppError, toAppError } from "../utils/firebaseErrors";
import { invalidateCache } from "./contentCache";

/**
 * One-shot sample-content seeder (admin-triggered from the dashboard).
 *
 * Writes go through the caller's signed-in admin session, so every
 * Security Rule is enforced exactly as normal admin edits. Fixed
 * document ids make the operation idempotent, and the fill-missing
 * contract never overwrites anything the owner has already created:
 * existing documents are skipped untouched, missing ones are added.
 * Seeded entries are regular Firestore documents, fully editable and
 * deletable from the admin UI like any other content.
 */

export interface SeedResult {
  /** Seed entities that were written this run (human-readable labels). */
  filled: string[];
  /** Seed entities that already existed and were left untouched. */
  skipped: string[];
}

const PROFILE_PATH = "profile";
const PROFILE_PUBLIC_ID = "public";
const PROFILE_CONTACT_ID = "contact";
const SETTINGS_PATH = "settings";
const CONTACT_PATH = "contact";
const SINGLETON_ID = "main";
const SKILLS_PATH = "skills";
const PROJECTS_PATH = "projects";

/** Placeholder contact identity — replace it from Admin → Profile. */
export const SEED_CONTACT_EMAIL = "hello@subodhshah.dev";

const PROFILE_PUBLIC = {
  name: "Subodh Shah",
  role: "Full Stack Developer",
  headline: "I build fast, reliable products from database to deployment.",
  bio: "I'm a full stack developer who enjoys turning complex problems into clean, approachable products — from database schema to the last pixel of the interface.\n\nOutside of work you'll find me exploring new frameworks, contributing to open source, and shaving seconds off my workflow with one small automation at a time.",
  profileImageUrl: "https://picsum.photos/seed/subodh-portrait/640/800",
};

interface SeedSkill {
  category: string;
  name: string;
}

const SKILLS: SeedSkill[] = [
  { category: "Languages", name: "TypeScript" },
  { category: "Languages", name: "JavaScript" },
  { category: "Languages", name: "HTML" },
  { category: "Languages", name: "CSS" },
  { category: "Languages", name: "SQL" },
  { category: "Languages", name: "Python" },
  { category: "Frontend", name: "React" },
  { category: "Frontend", name: "Next.js" },
  { category: "Frontend", name: "Tailwind CSS" },
  { category: "Frontend", name: "Vite" },
  { category: "Frontend", name: "Responsive Design" },
  { category: "Frontend", name: "Accessibility" },
  { category: "Backend", name: "Node.js" },
  { category: "Backend", name: "Express" },
  { category: "Backend", name: "REST APIs" },
  { category: "Backend", name: "GraphQL" },
  { category: "Backend", name: "JWT & OAuth" },
  { category: "Backend", name: "Firebase" },
  { category: "Database", name: "PostgreSQL" },
  { category: "Database", name: "MongoDB" },
  { category: "Database", name: "Redis" },
  { category: "Database", name: "Cloud Firestore" },
  { category: "DevOps", name: "Docker" },
  { category: "DevOps", name: "CI/CD" },
  { category: "DevOps", name: "AWS" },
  { category: "DevOps", name: "Vercel" },
  { category: "Testing & Tooling", name: "Vitest" },
  { category: "Testing & Tooling", name: "Jest" },
  { category: "Testing & Tooling", name: "Playwright" },
  { category: "Testing & Tooling", name: "Git & GitHub" },
];

interface SeedProject {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  techStack: string[];
  features: string[];
  date: string;
  featured: boolean;
  thumbnailUrl: string;
}

const PROJECTS: SeedProject[] = [
  {
    id: "devboard",
    title: "DevBoard",
    subtitle: "Realtime kanban for distributed teams",
    description:
      "A collaborative kanban board where updates land in realtime — drag cards between lists, see teammates as they move, and keep working when the network drops.",
    techStack: ["React", "TypeScript", "Node.js", "PostgreSQL", "WebSockets"],
    features: [
      "Realtime presence and activity indicators",
      "Drag-and-drop lists with optimistic updates",
      "Offline support with background sync",
      "Role-based boards with shareable guest links",
    ],
    date: "2025",
    featured: true,
    thumbnailUrl: "https://picsum.photos/seed/devboard/960/600",
  },
  {
    id: "invoicekit",
    title: "InvoiceKit",
    subtitle: "Invoicing and client billing for freelancers",
    description:
      "Recurring invoices, Stripe-powered payments, and a client portal with download history — billing without a spreadsheet in sight.",
    techStack: ["Next.js", "TypeScript", "Stripe", "PostgreSQL", "Prisma"],
    features: [
      "Recurring invoices with payment reminders",
      "Stripe checkout, receipts, and refunds",
      "Client portal with invoice download history",
      "Tax-aware reporting and CSV export",
    ],
    date: "2025",
    featured: false,
    thumbnailUrl: "https://picsum.photos/seed/invoicekit/960/600",
  },
  {
    id: "campushub",
    title: "CampusHub",
    subtitle: "Campus events and club management platform",
    description:
      "A hub for campus life — publish events, run club memberships, and reach students with timely notifications.",
    techStack: ["React", "Node.js", "Express", "MongoDB", "Redis"],
    features: [
      "Event discovery with calendar subscriptions",
      "Club pages with membership workflows",
      "Push notifications for schedule changes",
      "Moderation tools for student organizers",
    ],
    date: "2024",
    featured: false,
    thumbnailUrl: "https://picsum.photos/seed/campushub/960/600",
  },
  {
    id: "weatherly",
    title: "Weatherly",
    subtitle: "Hyperlocal weather with minute-by-minute radar",
    description:
      "Forecasts that respect your attention: precise radar, severe-weather alerts, and an installable experience that works offline.",
    techStack: ["TypeScript", "Vite", "Mapbox", "PWA", "Service Workers"],
    features: [
      "Minute-by-minute precipitation radar",
      "Severe weather alerts by saved location",
      "Installable PWA with offline caching",
      "Multi-location comparison view",
    ],
    date: "2024",
    featured: false,
    thumbnailUrl: "https://picsum.photos/seed/weatherly/960/600",
  },
];

/** Counts surfaced in the dashboard confirmation copy. */
export const SEED_COUNTS = {
  skills: SKILLS.length,
  projects: PROJECTS.length,
} as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Fixed document ids (exported so tests can simulate a fully seeded site). */
export const SEED_SKILL_IDS: readonly string[] = SKILLS.map((skill) => slugify(skill.name));
export const SEED_PROJECT_IDS: readonly string[] = PROJECTS.map((project) => project.id);

interface SiteState {
  profile: { exists(): boolean };
  profileContact: { exists(): boolean };
  settings: { exists(): boolean };
  contact: { exists(): boolean };
  skills: { size: number; docs: { id: string }[] };
  projects: { size: number; docs: { id: string }[] };
}

async function readSiteState(): Promise<SiteState> {
  const [profile, profileContact, settings, contact, skills, projects] = await Promise.all([
    getDoc(doc(db, PROFILE_PATH, PROFILE_PUBLIC_ID)),
    getDoc(doc(db, PROFILE_PATH, PROFILE_CONTACT_ID)),
    getDoc(doc(db, SETTINGS_PATH, SINGLETON_ID)),
    getDoc(doc(db, CONTACT_PATH, SINGLETON_ID)),
    getDocs(query(collection(db, SKILLS_PATH))),
    getDocs(query(collection(db, PROJECTS_PATH))),
  ]);
  return { profile, profileContact, settings, contact, skills, projects };
}

/**
 * Fills in the missing pieces of the sample portfolio in one batched write.
 *
 * Existing documents are never overwritten or duplicated — each seed entity
 * is written only when its document is absent, and the returned SeedResult
 * reports what was filled versus skipped. Throws an AppError without any
 * writes when every sample entry is already in place.
 */
export async function seedDemoData(): Promise<SeedResult> {
  try {
    const state = await readSiteState();
    const existingSkillIds = new Set(state.skills.docs.map((entry) => entry.id));
    const existingProjectIds = new Set(state.projects.docs.map((entry) => entry.id));

    const missingSkills = SKILLS.filter((skill) => !existingSkillIds.has(slugify(skill.name)));
    const missingProjects = PROJECTS.filter((project) => !existingProjectIds.has(project.id));
    const needsProfile = !state.profile.exists();
    const needsProfileContact = !state.profileContact.exists();
    const needsSettings = !state.settings.exists();
    const needsContact = !state.contact.exists();

    const nothingToDo =
      !needsProfile &&
      !needsProfileContact &&
      !needsSettings &&
      !needsContact &&
      missingSkills.length === 0 &&
      missingProjects.length === 0;
    if (nothingToDo) {
      throw createAppError(
        "invalid-input",
        "Nothing to add — every sample entry is already in this site.",
      );
    }

    const filled: string[] = [];
    const skipped: string[] = [];
    const writtenPaths = new Set<string>();

    const batch = writeBatch(db);
    const set = (
      path: string,
      id: string,
      data: Record<string, unknown>,
      label: string,
    ): void => {
      batch.set(doc(db, path, id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      filled.push(label);
      writtenPaths.add(path);
    };
    const skip = (label: string): void => {
      skipped.push(label);
    };

    if (needsProfile) {
      set(PROFILE_PATH, PROFILE_PUBLIC_ID, PROFILE_PUBLIC, "profile");
    } else {
      skip("profile");
    }
    if (needsProfileContact) {
      set(PROFILE_PATH, PROFILE_CONTACT_ID, { email: SEED_CONTACT_EMAIL }, "profile contact");
    } else {
      skip("profile contact");
    }

    missingSkills.forEach((skill, index) => {
      set(
        SKILLS_PATH,
        slugify(skill.name),
        {
          category: skill.category,
          name: skill.name,
          status: "published",
          order: state.skills.size + index,
          publishedAt: serverTimestamp(),
        },
        `skill: ${skill.name}`,
      );
    });
    if (missingSkills.length < SKILLS.length) {
      SKILLS.filter((skill) => existingSkillIds.has(slugify(skill.name))).forEach((skill) =>
        skip(`skill: ${skill.name}`),
      );
    }

    missingProjects.forEach((project, index) => {
      set(
        PROJECTS_PATH,
        project.id,
        {
          title: project.title,
          subtitle: project.subtitle,
          description: project.description,
          techStack: project.techStack,
          features: project.features,
          date: project.date,
          featured: project.featured,
          thumbnailUrl: project.thumbnailUrl,
          // Gallery strip: three deterministic placeholders per project.
          images: [1, 2, 3].map(
            (slot) => `https://picsum.photos/seed/${project.id}-g${slot}/1200/750`,
          ),
          status: "published",
          order: state.projects.size + index,
          publishedAt: serverTimestamp(),
        },
        `project: ${project.title}`,
      );
    });
    if (missingProjects.length < PROJECTS.length) {
      PROJECTS.filter((project) => existingProjectIds.has(project.id)).forEach((project) =>
        skip(`project: ${project.title}`),
      );
    }

    if (needsSettings) {
      set(
        SETTINGS_PATH,
        SINGLETON_ID,
        {
          siteTitle: `${PROFILE_PUBLIC.name} — ${PROFILE_PUBLIC.role}`,
          siteDescription: `Portfolio of ${PROFILE_PUBLIC.name}, ${PROFILE_PUBLIC.role} — projects, skills, and ways to get in touch.`,
          footerText: "Built with React, Vite & Firebase",
          sections: { ...DEFAULT_SECTION_VISIBILITY },
          enabled: true,
        },
        "settings",
      );
    } else {
      skip("settings");
    }

    if (needsContact) {
      set(
        CONTACT_PATH,
        SINGLETON_ID,
        {
          title: "Get in touch",
          description:
            "Have a project in mind, or just want to say hello — my inbox is always open.",
          email: SEED_CONTACT_EMAIL,
          enabled: true,
        },
        "contact",
      );
    } else {
      skip("contact");
    }

    await batch.commit();

    for (const path of writtenPaths) {
      invalidateCache(path);
    }

    return { filled, skipped };
  } catch (error) {
    throw toAppError(error);
  }
}
