/**
 * Seeds dummy preview data into the live Firestore project: one active
 * resume (a local sample CV) and three published projects with hand-made
 * SVG thumbnails under public/dummy/. Everything is ordinary collection
 * data — delete it from the admin panel like any other content.
 *
 * Usage (from the repo root, requires your admin account):
 *   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=... npm run seed:dummy
 *
 * Refuses to run when projects already exist unless FORCE=1 is set.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { initializeApp } from "firebase/app";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readEnvLocal() {
  const text = readFileSync(join(root, ".env.local"), "utf8");
  const values = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (match !== null) values[match[1]] = match[2].trim();
  }
  return values;
}

const env = readEnvLocal();
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (email === undefined || password === undefined) {
  console.error(
    "Missing credentials. Run:\n  SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=... npm run seed:dummy",
  );
  process.exit(1);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, email, password);
console.log(`Signed in as ${email}`);

const existing = await getDocs(query(collection(db, "projects"), limit(1)));
if (!existing.empty && process.env.FORCE !== "1") {
  console.error(
    "Projects already exist in Firestore. Delete them from the admin panel first, or re-run with FORCE=1.",
  );
  process.exit(1);
}

const actives = await getDocs(
  query(collection(db, "resumes"), where("isActive", "==", true)),
);
for (const snapshot of actives.docs) {
  await updateDoc(doc(db, "resumes", snapshot.id), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
  console.log(`Deactivated previous active resume ${snapshot.id}`);
}

await setDoc(doc(collection(db, "resumes")), {
  source: "external",
  downloadUrl: "/dummy/sample-cv.pdf",
  fileName: "Sample CV.pdf",
  isActive: true,
  updatedAt: serverTimestamp(),
});
console.log("Seeded active resume (/dummy/sample-cv.pdf)");

const projects = [
  {
    title: "Nimbus Notes",
    subtitle: "Markdown notes with offline sync",
    description:
      "A note-taking app for people who live in plain text.\n\nNotes sync in the background, conflict-free, and stay fully readable as local files. Search, tags, and a keyboard-first editor round out the daily workflow.",
    techStack: ["TypeScript", "React", "IndexedDB", "Service Workers"],
    features: ["Offline-first editing", "Conflict-free sync", "Full-text search", "Keyboard-first UI"],
    githubUrl: "https://github.com/example/nimbus-notes",
    liveDemoUrl: "https://example.com/nimbus",
    thumbnailUrl: "/dummy/projects/project-1.svg",
    lifecycle: "shipped",
    date: "2025",
    featured: true,
    images: ["/dummy/projects/gallery-1.svg", "/dummy/projects/gallery-2.svg"],
  },
  {
    title: "Pulse Board",
    subtitle: "Real-time metrics dashboard",
    description:
      "A live dashboard for product and infrastructure metrics.\n\nWidgets stream over websockets, snapshots are shareable, and every panel is keyboard navigable.",
    techStack: ["React", "WebSocket", "D3", "Node.js"],
    features: ["Live streaming widgets", "Shareable snapshots", "Role-based views"],
    githubUrl: "https://github.com/example/pulse-board",
    liveDemoUrl: "https://example.com/pulse",
    thumbnailUrl: "/dummy/projects/project-2.svg",
    lifecycle: "in-progress",
    date: "2026",
    featured: false,
    images: [],
  },
  {
    title: "Harbor CLI",
    subtitle: "One-command deploys for small teams",
    description:
      "A deploy CLI that turns a repo into a running app in one command.\n\nHarbor plans the build, provisions containers, and streams structured logs back to the terminal.",
    techStack: ["Go", "Docker", "CLI"],
    features: ["One-command deploys", "Structured log streaming", "Rollback support"],
    githubUrl: "https://github.com/example/harbor-cli",
    liveDemoUrl: "",
    thumbnailUrl: "/dummy/projects/project-3.svg",
    lifecycle: "planned",
    date: "2026",
    featured: false,
    images: [],
  },
];

for (const [position, project] of projects.entries()) {
  const payload = {
    ...project,
    liveDemoUrl: project.liveDemoUrl,
    status: "published",
    order: position,
    publishedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  // Empty optional URLs are stored as-is; the public loader treats "" as absent.
  const reference = doc(collection(db, "projects"));
  await setDoc(reference, payload);
  console.log(`Seeded project ${reference.id}: ${project.title}`);
}

console.log("\nDone. Preview at the site root; delete everything from Admin → Projects / Resume.");
process.exit(0);
