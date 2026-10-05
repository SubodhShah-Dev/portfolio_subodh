import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

/**
 * Cloud Storage Security Rules coverage (§22, §24).
 *
 * Admin identity comes from admins/{uid} in Firestore — the same roster the
 * app uses — so uploads are checked against a single source of truth.
 */

const PROJECT_ID = "demo-portfolio-cms";
const ADMIN_UID = "admin-user";
const STRANGER_UID = "stranger-user";

let env: RulesTestEnvironment;

type ContextFirestore = ReturnType<RulesTestContext["firestore"]>;
type ContextStorage = ReturnType<RulesTestContext["storage"]>;

function cast(context: { firestore(): ContextFirestore }): Firestore {
  return context.firestore() as unknown as Firestore;
}

const adminStorage = () => env.authenticatedContext(ADMIN_UID).storage();
const strangerStorage = () => env.authenticatedContext(STRANGER_UID).storage();
const anonStorage = () => env.unauthenticatedContext().storage();

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4\n%fixture\n%%EOF\n");

function putFile(
  storage: ContextStorage,
  path: string,
  data: Uint8Array,
  contentType: string,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const task = storage.ref(path).put(data, { contentType });
    task.on(
      "state_changed",
      () => {},
      (error: unknown) =>
        reject(error instanceof Error ? error : new Error(String(error))),
      () => resolve(undefined),
    );
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(cast(context), "admins", ADMIN_UID), { role: "admin" });
  });
});

describe("resume uploads", () => {
  it("lets admins upload PDFs under the size limit", async () => {
    await assertSucceeds(putFile(adminStorage(), "resumes/admin.pdf", PDF_BYTES, "application/pdf"));
  });

  it("rejects anonymous and non-admin uploads", async () => {
    await assertFails(
      putFile(anonStorage(), "resumes/anon.pdf", PDF_BYTES, "application/pdf"),
    );
    await assertFails(
      putFile(strangerStorage(), "resumes/stranger.pdf", PDF_BYTES, "application/pdf"),
    );
  });

  it("rejects non-PDF content types", async () => {
    await assertFails(
      putFile(adminStorage(), "resumes/fake.pdf", PDF_BYTES, "text/plain"),
    );
  });

  it("rejects files above the 10 MB limit", async () => {
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
    await assertFails(
      putFile(adminStorage(), "resumes/huge.pdf", oversized, "application/pdf"),
    );
  });

  it("denies every path outside resumes/", async () => {
    await assertFails(
      putFile(adminStorage(), "other/file.pdf", PDF_BYTES, "application/pdf"),
    );
    await assertFails(
      putFile(adminStorage(), "resumes/nested/deep.pdf", PDF_BYTES, "application/pdf"),
    );
  });
});

describe("resume downloads and deletion", () => {
  it("lets anyone read an uploaded resume", async () => {
    await assertSucceeds(putFile(adminStorage(), "resumes/public.pdf", PDF_BYTES, "application/pdf"));

    await assertSucceeds(adminStorage().ref("resumes/public.pdf").getMetadata());
    await assertSucceeds(anonStorage().ref("resumes/public.pdf").getMetadata());
    await assertSucceeds(anonStorage().ref("resumes/public.pdf").getDownloadURL());
  });

  it("restricts deletion to admins", async () => {
    await assertSucceeds(putFile(adminStorage(), "resumes/delete-me.pdf", PDF_BYTES, "application/pdf"));

    await assertFails(anonStorage().ref("resumes/delete-me.pdf").delete());
    await assertFails(strangerStorage().ref("resumes/delete-me.pdf").delete());
    await assertSucceeds(adminStorage().ref("resumes/delete-me.pdf").delete());
  });
});
