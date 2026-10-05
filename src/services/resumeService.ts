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
import { deleteObject, ref as storageRef } from "firebase/storage";

import { db, storage } from "../config/firebase";
import { createAppError, getFirebaseCode, toAppError } from "../utils/firebaseErrors";
import { isValidHttpUrl } from "../utils/urlValidation";
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
 * Saves an admin-supplied external download URL — never generated (§24).
 * Activates automatically only when no active resume exists yet.
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

  try {
    const activeSnapshot = await getDocs(
      query(
        collectionRef<DocData<Resume>>(PATH),
        where("isActive", "==", true),
        limit(1),
      ),
    );
    const payload: Record<string, unknown> = {
      source: "external",
      downloadUrl,
      isActive: activeSnapshot.empty,
      updatedAt: serverTimestamp(),
    };
    const fileName = input.fileName?.trim();
    if (fileName !== undefined && fileName !== "") {
      payload.fileName = fileName;
    }
    const reference = await addDoc(collection(db, PATH), payload);
    invalidateCache(PATH);
    return reference.id;
  } catch (error) {
    throw toAppError(error);
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
