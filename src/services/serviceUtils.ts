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
  updateDoc,
  where,
  writeBatch,
  type CollectionReference,
  type DocumentReference,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { getFirebaseCode, toAppError } from "../utils/firebaseErrors";
import { cached, invalidateCache } from "./contentCache";
import type { ContentStatus } from "../types/common";

/**
 * Shared Firestore primitives (§62).
 *
 * Every service function goes through these helpers so caching, timestamp
 * handling, error normalization, and cache invalidation stay consistent.
 * Public queries always carry the same constraints Security Rules enforce
 * (e.g. status == "published") — rules are not filters (§12, §34).
 */

export type DocData<T> = Omit<T, "id">;

export function collectionRef<T>(path: string): CollectionReference<T> {
  return collection(db, path) as CollectionReference<T>;
}

export function documentRef<T>(path: string, id: string): DocumentReference<T> {
  return doc(db, path, id) as DocumentReference<T>;
}

export function snapshotToDoc<T extends { id: string }>(
  snapshot: QueryDocumentSnapshot<DocData<T>>,
): T {
  return { ...snapshot.data(), id: snapshot.id } as T;
}

export interface FetchOrderedOptions {
  /** Adds where("status", "==", "published") — required for public reads. */
  publishedOnly?: boolean;
  /** Skip the shared cache (fresh data on every call, e.g. admin inboxes). */
  skipCache?: boolean;
  /** Overrides the default `${path}:published|all` cache key. */
  cacheKey?: string;
}

/** Ordered list read; caches under path-derived key unless skipCache. */
export async function fetchOrdered<T extends { id: string }>(
  path: string,
  options: FetchOrderedOptions = {},
): Promise<T[]> {
  const key =
    options.cacheKey ??
    `${path}:${options.publishedOnly === true ? "published" : "all"}`;

  const load = async (): Promise<T[]> => {
    const constraints: QueryConstraint[] =
      options.publishedOnly === true
        ? [where("status", "==", "published"), orderBy("order", "asc")]
        : [orderBy("order", "asc")];
    const snapshot = await getDocs(
      query(collectionRef<DocData<T>>(path), ...constraints),
    );
    return snapshot.docs.map((entry) => snapshotToDoc<T>(entry));
  };

  return options.skipCache === true ? load() : cached(key, load);
}

/**
 * Single-document read by id.
 *
 * A permission-denied or not-found result maps to null — for the public
 * project page this yields a proper Not Found state for drafts/nonexistent
 * ids without leaking their existence (§53). Real failures throw a
 * normalized AppError.
 */
export async function fetchDocById<T extends { id: string }>(
  path: string,
  id: string,
  options: { skipCache?: boolean } = {},
): Promise<T | null> {
  const key = `${path}:byId:${id}`;

  const load = async (): Promise<T | null> => {
    try {
      const snapshot = await getDoc(documentRef<DocData<T>>(path, id));
      if (!snapshot.exists()) return null;
      return snapshotToDoc<T>(snapshot);
    } catch (error) {
      const code = getFirebaseCode(error);
      if (code === "firestore/permission-denied" || code === "firestore/not-found") {
        return null;
      }
      throw toAppError(error);
    }
  };

  return options.skipCache === true ? load() : cached(key, load);
}

/** Creates a document with server timestamps; sets publishedAt when published. */
export async function createDoc(
  path: string,
  data: Record<string, unknown>,
  options: { published?: boolean } = {},
): Promise<string> {
  try {
    const payload: Record<string, unknown> = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (options.published === true) {
      payload.publishedAt = serverTimestamp();
    }
    const reference = await addDoc(collection(db, path), payload);
    invalidateCache(path);
    return reference.id;
  } catch (error) {
    throw toAppError(error);
  }
}

/** Applies a partial update plus updatedAt; invalidates the collection cache. */
export async function updateDocFields(
  path: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    await updateDoc(documentRef(path, id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
    invalidateCache(path);
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Content lifecycle transition (§11): sets status and maintains publishedAt
 * (set on publish, removed otherwise).
 */
export async function setStatus(
  path: string,
  id: string,
  status: ContentStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  patch.publishedAt =
    status === "published" ? serverTimestamp() : deleteField();
  await updateDocFields(path, id, patch);
}

export async function removeDoc(path: string, id: string): Promise<void> {
  try {
    await deleteDoc(documentRef(path, id));
    invalidateCache(path);
  } catch (error) {
    throw toAppError(error);
  }
}

/** Rewrites `order` (0..n-1) for the given id sequence in one batch (§49). */
export async function reorderDocs(path: string, ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ids.forEach((id, index) => {
      batch.update(documentRef(path, id), {
        order: index,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    invalidateCache(path);
  } catch (error) {
    throw toAppError(error);
  }
}

/**
 * Upserts a singleton document (profile/public, contact/main, settings/main)
 * with merge. createdAt is written only on first creation (§29).
 */
export async function upsertSingleDoc(
  path: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const reference = documentRef(path, id);
    const existing = await getDoc(reference);
    const payload: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(reference, payload, { merge: true });
    invalidateCache(path);
  } catch (error) {
    throw toAppError(error);
  }
}

/** Unguarded single-doc read for config documents (contact, settings). */
export async function fetchSingleDoc<T extends { id: string }>(
  path: string,
  id: string,
  options: { skipCache?: boolean } = {},
): Promise<T | null> {
  const key = `${path}:byId:${id}`;

  const load = async (): Promise<T | null> => {
    try {
      const snapshot = await getDoc(documentRef<DocData<T>>(path, id));
      if (!snapshot.exists()) return null;
      return snapshotToDoc<T>(snapshot);
    } catch (error) {
      const code = getFirebaseCode(error);
      if (code === "firestore/permission-denied" || code === "firestore/not-found") {
        return null;
      }
      throw toAppError(error);
    }
  };

  return options.skipCache === true ? load() : cached(key, load);
}
