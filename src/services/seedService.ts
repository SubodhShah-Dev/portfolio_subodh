import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { DEFAULT_SECTION_VISIBILITY } from "../types/settings";
import { createAppError, toAppError } from "../utils/firebaseErrors";
import { invalidateCache } from "./contentCache";

/**
 * One-shot sample-content seeder (admin-triggered from the dashboard).
 *
 * Writes go through the caller's signed-in admin session, so every
 * Security Rule is enforced exactly as with normal admin edits. Fixed
 * document ids make the operation idempotent, and a strict empty-site
 * guard refuses to overwrite anything the owner has already created —
 * seeded entries are regular Firestore documents, fully editable and
 * deletable from the admin UI like any other content.
 */

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

async function isSiteEmpty(): Promise<boolean> {
  const [profile, settings, contact, skills, projects] = await Promise.all([
    getDoc(doc(db, PROFILE_PATH, PROFILE_PUBLIC_ID)),
    getDoc(doc(db, SETTINGS_PATH, SINGLETON_ID)),
    getDoc(doc(db, CONTACT_PATH, SINGLETON_ID)),
    getDocs(query(collection(db, SKILLS_PATH))),
    getDocs(query(collection(db, PROJECTS_PATH))),
  ]);
  return (
    !profile.exists() &&
    !settings.exists() &&
    !contact.exists() &&
    skills.empty &&
    projects.empty
  );
}

/**
 * Creates the full sample portfolio in one batched write.
 *
 * Refuses with an AppError when the site is not completely empty, so
 * nothing an owner created can ever be overwritten or duplicated.
 */
export async function seedDemoData(): Promise<void> {
  try {
    if (!(await isSiteEmpty())) {
      throw createAppError(
        "invalid-input",
        "Sample content can only be loaded into a completely empty site — some content already exists.",
      );
    }

    const batch = writeBatch(db);
    const set = (reference: DocumentReference, data: Record<string, unknown>): void => {
      batch.set(reference, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    };

    set(doc(db, PROFILE_PATH, PROFILE_PUBLIC_ID), PROFILE_PUBLIC);
    set(doc(db, PROFILE_PATH, PROFILE_CONTACT_ID), { email: SEED_CONTACT_EMAIL });

    SKILLS.forEach((skill, index) => {
      set(doc(db, SKILLS_PATH, slugify(skill.name)), {
        category: skill.category,
        name: skill.name,
        status: "published",
        order: index,
        publishedAt: serverTimestamp(),
      });
    });

    PROJECTS.forEach((project, index) => {
      set(doc(db, PROJECTS_PATH, project.id), {
        title: project.title,
        subtitle: project.subtitle,
        description: project.description,
        techStack: project.techStack,
        features: project.features,
        date: project.date,
        featured: project.featured,
        thumbnailUrl: project.thumbnailUrl,
        status: "published",
        order: index,
        publishedAt: serverTimestamp(),
      });
    });

    set(doc(db, SETTINGS_PATH, SINGLETON_ID), {
      siteTitle: `${PROFILE_PUBLIC.name} — ${PROFILE_PUBLIC.role}`,
      siteDescription: `Portfolio of ${PROFILE_PUBLIC.name}, ${PROFILE_PUBLIC.role} — projects, skills, and ways to get in touch.`,
      footerText: "Built with React, Vite & Firebase",
      sections: { ...DEFAULT_SECTION_VISIBILITY },
      enabled: true,
    });

    set(doc(db, CONTACT_PATH, SINGLETON_ID), {
      title: "Get in touch",
      description:
        "Have a project in mind, or just want to say hello — my inbox is always open.",
      email: SEED_CONTACT_EMAIL,
      enabled: true,
    });

    await batch.commit();

    for (const path of [PROFILE_PATH, SKILLS_PATH, PROJECTS_PATH, SETTINGS_PATH, CONTACT_PATH]) {
      invalidateCache(path);
    }
  } catch (error) {
    throw toAppError(error);
  }
}
