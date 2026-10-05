import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "../config/firebase";
import { createAppError, getFirebaseCode, toAppError } from "../utils/firebaseErrors";
import { isValidHttpUrl } from "../utils/urlValidation";
import { validateResumeFile } from "../utils/resumeValidation";
import { cached, invalidateCache } from "./contentCache";
import {
  collectionRef,
  documentRef,
  removeDoc,
  snapshotToDoc,
  type DocData,
} from "./serviceUtils";
import type { ExternalResumeInput, Resume } from "../types/resume";

/**
 * Resume management (§21–§24).
 *
 * Public reads only ever see the single active resume, matching the
 * Security Rule constraint `isActive == true` (§12). Admins manage the full
 * list. New resumes are created inactive unless no active resume exists yet,
 * so replacing a resume is an explicit activation (§21).
 */

const PATH = "resumes";
const ACTIVE_CACHE_KEY = "resumes:active";

/** The one publicly downloadable resume, or null when none is active. */
export async function getActiveResume(): Promise<Resume | null> {
  return cached(ACTIVE_CACHE_KEY, async () => {
    try {
      const snapshot = await getDocs(
        query(
          collectionRef<DocData<Resume>>(PATH),
          where("isActive", "==", true),
          orderBy("updatedAt", "desc"),
          limit(1),
        ),
      );
      if (snapshot.empty) return null;
      return snapshotToDoc<Resume>(snapshot.docs[0]);
    } catch (error) {
      const code = getFirebaseCode(error);
      if (
        code === "firestore/permission-denied" ||
        code === "firestore/not-found"
      ) {
        return null;
      }
      throw toAppError(error);
    }
  });
}

/** Every resume including inactive — admin only (§11). */
export async function getResumes(): Promise<Resume[]> {
  try {
    const snapshot = await getDocs(
      query(collectionRef<DocData<Resume>>(PATH), orderBy("updatedAt", "desc")),
    );
    return snapshot.docs.map((entry) => snapshotToDoc<Resume>(entry));
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Inserts a resume document. It becomes active automatically only when no
 * active resume exists yet, so replacing a resume is an explicit activation.
 */
async function insertResume(data: Record<string, unknown>): Promise<string> {
  try {
    const activeSnapshot = await getDocs(
      query(
        collectionRef<DocData<Resume>>(PATH),
        where("isActive", "==", true),
        limit(1),
      ),
    );
    const reference = await addDoc(collection(db, PATH), {
      ...data,
      isActive: activeSnapshot.empty,
      updatedAt: serverTimestamp(),
    });
    invalidateCache(PATH);
    return reference.id;
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Saves an admin-supplied external download URL — never generated (§24).
 */
export async function saveExternalResume(
  input: ExternalResumeInput,
): Promise<string> {
  const downloadUrl = input.downloadUrl.trim();
  if (!isValidHttpUrl(downloadUrl)) {
    throw createAppError(
      "invalid-input",
      "Enter a valid resume URL starting with http:// or https://.",
    );
  }

  const payload: Record<string, unknown> = { source: "external", downloadUrl };
  const fileName = input.fileName?.trim();
  if (fileName !== undefined && fileName !== "") {
    payload.fileName = fileName;
  }
  return insertResume(payload);
}

/**
 * Uploads a validated PDF to Storage under a random path and records it as a
 * resume document (§22). If the document write fails afterwards, the just
 * uploaded file is removed best-effort so no orphaned object is left behind.
 */
export async function uploadResume(file: File): Promise<string> {
  const issue = validateResumeFile(file);
  if (issue !== null) {
    throw createAppError("invalid-input", issue);
  }

  const path = `resumes/${crypto.randomUUID()}.pdf`;
  const objectRef = storageRef(storage, path);
  let uploaded = false;

  try {
    await uploadBytes(objectRef, file, { contentType: "application/pdf" });
    uploaded = true;
    const downloadUrl = await getDownloadURL(objectRef);
    return await insertResume({
      source: "storage",
      storagePath: path,
      downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      contentType: "application/pdf",
      uploadedAt: serverTimestamp(),
    });
  } catch (error) {
    // Best-effort cleanup when the upload succeeded but the write failed.
    if (uploaded) {
      try {
        await deleteObject(objectRef);
      } catch (cleanupError) {
        console.warn("Could not clean up partially uploaded resume:", cleanupError);
      }
    }
    const appError = toAppError(error);
    const rawCode = getFirebaseCode(error);
    if (
      appError.code === "unknown" &&
      rawCode !== null &&
      rawCode.startsWith("storage/")
    ) {
      // Unmapped storage failure — surface the neutral, plan-agnostic message.
      throw createAppError("storage-unavailable", undefined, error);
    }
    throw appError;
  }
}

/** Makes exactly one resume active; every other resume becomes inactive (§21). */
export async function setActiveResume(id: string): Promise<void> {
  try {
    const all = await getResumes();
    const batch = writeBatch(db);
    for (const resume of all) {
      batch.update(documentRef<DocData<Resume>>(PATH, resume.id), {
        isActive: resume.id === id,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    invalidateCache(PATH);
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Deletes resume metadata; a stored file (if any) is removed best-effort so
 * the document never points at orphaned storage (§24). Storage failures are
 * logged but do not fail the deletion — the doc is the source of truth.
 */
export async function deleteResume(id: string): Promise<void> {
  try {
    const snapshot = await getDoc(documentRef<DocData<Resume>>(PATH, id));
    const storagePath = snapshot.exists() ? snapshot.data().storagePath : undefined;
    if (typeof storagePath === "string" && storagePath !== "") {
      try {
        await deleteObject(storageRef(storage, storagePath));
      } catch (error) {
        console.warn("Could not delete resume file from Storage:", error);
      }
    }
    await removeDoc(PATH, id);
  } catch (error) {
    throw toAppError(error);
  }
}
