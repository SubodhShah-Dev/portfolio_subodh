import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

/**
 * Firestore Security Rules coverage (§12, §32–§36).
 *
 * Every rule in firestore.rules has at least one allowing and one denying
 * assertion here, running against the real Emulator Suite (npm run test:rules).
 */

const PROJECT_ID = "demo-portfolio-cms";
const ADMIN_UID = "admin-user";
const STRANGER_UID = "stranger-user";

let env: RulesTestEnvironment;

type ContextFirestore = ReturnType<RulesTestContext["firestore"]>;

function cast(context: { firestore(): ContextFirestore }): Firestore {
  return context.firestore() as unknown as Firestore;
}

const anonDb = (): Firestore => cast(env.unauthenticatedContext());
const strangerDb = (): Firestore => cast(env.authenticatedContext(STRANGER_UID));
const adminDb = (): Firestore => cast(env.authenticatedContext(ADMIN_UID));

async function withRulesDisabled(
  run: (db: Firestore) => Promise<void>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    await run(cast(context));
  });
}

async function seedAdmin(): Promise<void> {
  await withRulesDisabled(async (db) => {
    await setDoc(doc(db, "admins", ADMIN_UID), { role: "admin" });
  });
}

async function seed(path: string, data: Record<string, unknown>): Promise<void> {
  await withRulesDisabled(async (db) => {
    await setDoc(doc(db, path), data);
  });
}

function contentDoc(
  status: "draft" | "published" | "archived",
  order = 0,
): Record<string, unknown> {
  return {
    title: "Fixture",
    subtitle: "",
    description: "",
    techStack: [],
    featured: false,
    features: [],
    status,
    order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** A published fixture whose publishedAt is already stored (stale vs request.time). */
function publishedContentDoc(order = 0): Record<string, unknown> {
  return { ...contentDoc("published", order), publishedAt: serverTimestamp() };
}

const VALID_MESSAGE: Record<string, unknown> = {
  name: "Visitor",
  email: "visitor@example.com",
  message: "Hello, I would like to work with you.",
  read: false,
  createdAt: serverTimestamp(),
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seedAdmin();
});

describe("ordered content reads", () => {
  it("lets anyone read published documents and published lists", async () => {
    await seed("projects/published-1", contentDoc("published"));
    const db = anonDb();

    await assertSucceeds(getDoc(doc(db, "projects/published-1")));
    await assertSucceeds(
      getDocs(
        query(
          collection(db, "projects"),
          where("status", "==", "published"),
          orderBy("order", "asc"),
        ),
      ),
    );
  });

  it("blocks drafts from anonymous and non-admin reads", async () => {
    await seed("projects/draft-1", contentDoc("draft"));
    const db = anonDb();
    const stranger = strangerDb();

    await assertFails(getDoc(doc(db, "projects/draft-1")));
    await assertFails(getDoc(doc(stranger, "projects/draft-1")));
    // Lists without the published constraint would expose drafts.
    await assertFails(getDocs(query(collection(db, "projects"), orderBy("order", "asc"))));
    await assertFails(
      getDocs(query(collection(stranger, "projects"), orderBy("order", "asc"))),
    );
  });

  it("lets admins read drafts and unfiltered lists", async () => {
    await seed("projects/draft-1", contentDoc("draft"));
    const db = adminDb();

    await assertSucceeds(getDoc(doc(db, "projects/draft-1")));
    await assertSucceeds(getDocs(collection(db, "projects")));
  });
});

describe("ordered content writes", () => {
  it("rejects all writes from anonymous and non-admin clients", async () => {
    await seed("projects/published-1", contentDoc("published"));

    await assertFails(addDoc(collection(anonDb(), "projects"), contentDoc("published")));
    await assertFails(
      updateDoc(doc(strangerDb(), "projects", "published-1"), {
        status: "draft",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(doc(strangerDb(), "projects", "published-1")));
  });

  it("allows admins to create, update, and delete", async () => {
    const db = adminDb();

    const created = await assertSucceeds(addDoc(collection(db, "projects"), contentDoc("draft")));

    await assertSucceeds(
      updateDoc(doc(db, "projects", created.id), {
        status: "published",
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(deleteDoc(doc(db, "projects", created.id)));
  });

  it("rejects structurally invalid admin writes", async () => {
    await seed("projects/published-1", contentDoc("published"));
    const db = adminDb();

    await assertFails(
      updateDoc(doc(db, "projects", "published-1"), { status: "not-a-status" }),
    );
    await assertFails(
      updateDoc(doc(db, "projects", "published-1"), { order: -1 }),
    );
    // Timestamps must be server-generated.
    await assertFails(
      updateDoc(doc(db, "projects", "published-1"), {
        status: "published",
        updatedAt: new Date(),
      }),
    );
  });

  it("lets admins reorder published documents that carry a stale publishedAt", async () => {
    await seed("projects/published-1", publishedContentDoc(0));
    await seed("projects/published-2", publishedContentDoc(1));
    const db = adminDb();

    // Shape of serviceUtils.reorderDocs: one atomic batch of {order, updatedAt}.
    const batch = writeBatch(db);
    batch.update(doc(db, "projects", "published-1"), {
      order: 1,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, "projects", "published-2"), {
      order: 0,
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
  });

  it("lets admins toggle featured on a published document", async () => {
    await seed("projects/published-1", publishedContentDoc(0));

    await assertSucceeds(
      updateDoc(doc(adminDb(), "projects", "published-1"), {
        featured: true,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("lets admins unpublish by removing publishedAt", async () => {
    await seed("projects/published-1", publishedContentDoc(0));

    await assertSucceeds(
      updateDoc(doc(adminDb(), "projects", "published-1"), {
        status: "draft",
        publishedAt: deleteField(),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("rejects forging or backdating publishedAt on update", async () => {
    await seed("projects/published-1", publishedContentDoc(0));
    await seed("projects/draft-1", contentDoc("draft"));
    const db = adminDb();
    const backdated = Timestamp.fromMillis(1_000_000_000_000);

    // Moving an existing publish date to the past is still forbidden.
    await assertFails(
      updateDoc(doc(db, "projects", "published-1"), {
        featured: true,
        publishedAt: backdated,
        updatedAt: serverTimestamp(),
      }),
    );
    // Minting a publish date on a document that has none is still forbidden.
    await assertFails(
      updateDoc(doc(db, "projects", "draft-1"), {
        publishedAt: backdated,
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe("profile, contact, and settings", () => {
  it("lets anyone read but only admins write", async () => {
    await seed("profile/public", { name: "Ada", updatedAt: serverTimestamp() });
    await seed("contact/main", {
      email: "ada@example.com",
      enabled: true,
      updatedAt: serverTimestamp(),
    });
    await seed("settings/main", {
      enabled: true,
      sections: { hero: true },
      updatedAt: serverTimestamp(),
    });

    await assertSucceeds(getDoc(doc(anonDb(), "profile/public")));
    await assertSucceeds(getDoc(doc(anonDb(), "contact/main")));
    await assertSucceeds(getDoc(doc(anonDb(), "settings/main")));

    await assertFails(
      setDoc(doc(anonDb(), "profile/public"), { name: "Fake" }),
    );
    await assertFails(
      updateDoc(doc(strangerDb(), "settings/main"), { enabled: false }),
    );
  });

  it("lets admins write singleton documents", async () => {
    const db = adminDb();

    await assertSucceeds(
      setDoc(doc(db, "profile", "public"), {
        name: "Ada",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      setDoc(
        doc(db, "settings", "main"),
        { enabled: true, updatedAt: serverTimestamp() },
        { merge: true },
      ),
    );
  });
});

describe("contact messages", () => {
  it("lets anyone create a valid message", async () => {
    await assertSucceeds(addDoc(collection(anonDb(), "messages"), VALID_MESSAGE));
  });

  it("rejects invalid message payloads", async () => {
    const db = anonDb();

    await assertFails(
      addDoc(collection(db, "messages"), { ...VALID_MESSAGE, message: "short" }),
    );
    await assertFails(
      addDoc(collection(db, "messages"), {
        ...VALID_MESSAGE,
        email: "not-an-email",
      }),
    );
    await assertFails(
      addDoc(collection(db, "messages"), { ...VALID_MESSAGE, read: true }),
    );
    await assertFails(
      addDoc(collection(db, "messages"), { ...VALID_MESSAGE, leaked: "field" }),
    );
    await assertFails(
      addDoc(collection(db, "messages"), { ...VALID_MESSAGE, createdAt: new Date() }),
    );
  });

  it("keeps messages private to admins", async () => {
    const id = (await assertSucceeds(addDoc(collection(anonDb(), "messages"), VALID_MESSAGE))).id;
    const path = doc(anonDb(), "messages", id);

    await assertFails(getDoc(path));
    await assertFails(getDocs(collection(anonDb(), "messages")));
    await assertFails(updateDoc(path, { read: true }));
    await assertFails(deleteDoc(path));

    await assertSucceeds(getDocs(collection(adminDb(), "messages")));
    await assertSucceeds(updateDoc(doc(adminDb(), "messages", id), { read: true }));
    await assertSucceeds(deleteDoc(doc(adminDb(), "messages", id)));
  });

  it("rejects admin updates outside the read flag", async () => {
    const id = (await assertSucceeds(addDoc(collection(anonDb(), "messages"), VALID_MESSAGE))).id;

    await assertFails(
      updateDoc(doc(adminDb(), "messages", id), { name: "Rewritten" }),
    );
  });
});

describe("resumes", () => {
  beforeEach(async () => {
    await seed("resumes/active", {
      source: "external",
      downloadUrl: "https://example.com/resume.pdf",
      isActive: true,
      updatedAt: serverTimestamp(),
    });
    await seed("resumes/inactive", {
      source: "external",
      downloadUrl: "https://example.com/old.pdf",
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  });

  it("exposes only the active resume to the public", async () => {
    const db = anonDb();

    await assertSucceeds(getDoc(doc(db, "resumes/active")));
    await assertFails(getDoc(doc(db, "resumes/inactive")));
    await assertSucceeds(
      getDocs(
        query(
          collection(db, "resumes"),
          where("isActive", "==", true),
          orderBy("updatedAt", "desc"),
        ),
      ),
    );
    await assertFails(getDocs(collection(db, "resumes")));
  });

  it("lets admins manage the full list", async () => {
    const db = adminDb();

    await assertSucceeds(getDocs(collection(db, "resumes")));
    const id = (
      await assertSucceeds(
        addDoc(collection(db, "resumes"), {
          source: "external",
          downloadUrl: "https://example.com/new.pdf",
          isActive: false,
          updatedAt: serverTimestamp(),
        }),
      )
    ).id;

    await assertSucceeds(
      updateDoc(doc(db, "resumes", id), {
        isActive: true,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(deleteDoc(doc(db, "resumes", id)));
  });

  it("rejects invalid resume documents and non-admin writes", async () => {
    await assertFails(
      addDoc(collection(adminDb(), "resumes"), {
        source: "link",
        downloadUrl: "https://example.com/r.pdf",
        isActive: false,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      addDoc(collection(anonDb(), "resumes"), {
        source: "external",
        downloadUrl: "https://example.com/r.pdf",
        isActive: false,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(anonDb(), "resumes", "active"), {
        isActive: false,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(doc(anonDb(), "resumes", "active")));
  });
});

describe("admin membership", () => {
  it("is readable only by its own signed-in user", async () => {
    await seed("admins/admin-user", { role: "admin" });

    await assertFails(getDoc(doc(anonDb(), "admins/admin-user")));
    await assertFails(getDoc(doc(strangerDb(), "admins/admin-user")));
    await assertSucceeds(getDoc(doc(adminDb(), "admins/admin-user")));
    // A user may probe their own (possibly missing) document.
    await assertSucceeds(getDoc(doc(strangerDb(), "admins/stranger-user")));
  });

  it("is never writable from any client, even the owner", async () => {
    await seed("admins/admin-user", { role: "admin" });

    await assertFails(
      setDoc(doc(adminDb(), "admins", "admin-user"), { role: "admin" }),
    );
    await assertFails(
      setDoc(doc(strangerDb(), "admins", "stranger-user"), { role: "admin" }),
    );
  });
});
