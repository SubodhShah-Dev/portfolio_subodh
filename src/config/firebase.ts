import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Firebase initialization (§59, §38).
 *
 * - Development (`npm run dev`, `.env.development`) sets
 *   VITE_USE_FIREBASE_EMULATORS=true, so local writes ALWAYS target the
 *   Emulator Suite and can never reach production data.
 * - When emulators are enabled, demo placeholders are used so the app runs
 *   before any real Firebase configuration exists (emulator-first setup).
 * - When emulators are disabled, real client configuration is REQUIRED and
 *   the app fails fast with an actionable message instead of silently
 *   connecting to nothing.
 *
 * All Firebase SDK calls live in src/services/* — this module only exports
 * the configured auth/db/storage instances.
 */

const EMULATOR_PROJECT_ID = "demo-portfolio-cms";
const EMULATOR_HOST = "127.0.0.1";
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8080;
const STORAGE_EMULATOR_PORT = 9199;

interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  useEmulators: boolean;
  siteUrl: string;
  appCheckSiteKey: string;
}

/** First non-empty value wins — empty strings from .env files must not win. */
function pick(...values: readonly (string | undefined)[]): string {
  for (const value of values) {
    if (value !== undefined && value !== "") return value;
  }
  return "";
}

function readEnv(): FirebaseEnv {
  const useEmulators = import.meta.env.MODE === "test"
    || import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

  if (useEmulators) {
    return {
      apiKey: pick(import.meta.env.VITE_FIREBASE_API_KEY, "demo-api-key"),
      authDomain: pick(
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        "demo-portfolio-cms.firebaseapp.com",
      ),
      projectId: pick(import.meta.env.VITE_FIREBASE_PROJECT_ID, EMULATOR_PROJECT_ID),
      storageBucket: pick(
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        "demo-portfolio-cms.appspot.com",
      ),
      messagingSenderId: pick(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "0"),
      appId: pick(import.meta.env.VITE_FIREBASE_APP_ID, "demo-app-id"),
      useEmulators: true,
      siteUrl: import.meta.env.VITE_SITE_URL ?? "",
      appCheckSiteKey: import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY ?? "",
    };
  }

  const env: FirebaseEnv = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
    useEmulators: false,
    siteUrl: import.meta.env.VITE_SITE_URL ?? "",
    appCheckSiteKey: import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY ?? "",
  };

  const missing = (
    ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"] as const
  ).filter((key) => env[key] === "");

  if (missing.length > 0) {
    throw new Error(
      `Firebase configuration is incomplete (missing: ${missing.join(", ")}). ` +
        "MANUAL CONFIGURATION REQUIRED: copy .env.example to .env.local and fill in the " +
        "Firebase client values, or set VITE_USE_FIREBASE_EMULATORS=true to run locally.",
    );
  }

  return env;
}

export const env = readEnv();

/** Canonical site URL (no trailing slash), empty until configured. */
export const siteUrl: string = env.siteUrl.replace(/\/+$/, "");

/** Emulator mode is exposed for diagnostics and test assertions. */
export const isEmulatorMode: boolean = env.useEmulators;

const firebaseConfig = {
  apiKey: env.apiKey,
  authDomain: env.authDomain,
  projectId: env.projectId,
  storageBucket: env.storageBucket,
  messagingSenderId: env.messagingSenderId,
  appId: env.appId,
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Storage is OPTIONAL (§23, §27): the instance is created regardless, and any
// actual upload failure is surfaced with neutral messaging plus the
// external-URL fallback. Never assumed to be billed/available.
export const storage: FirebaseStorage = getStorage(app);

interface GlobalScope {
  __portfolioEmulatorsConnected?: boolean;
  __portfolioAppCheckInitialized?: boolean;
}

const globalScope = globalThis as GlobalScope;

if (env.useEmulators && globalScope.__portfolioEmulatorsConnected !== true) {
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
  connectStorageEmulator(storage, EMULATOR_HOST, STORAGE_EMULATOR_PORT);
  globalScope.__portfolioEmulatorsConnected = true;
}

/**
 * Optional App Check bootstrap (§67).
 *
 * - No-ops when no site key is configured or when running on emulators.
 * - Never throws: App Check is hardening, not a runtime dependency.
 */
export function initAppCheck(): void {
  if (env.appCheckSiteKey === "" || env.useEmulators) return;
  if (globalScope.__portfolioAppCheckInitialized === true) return;

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    globalScope.__portfolioAppCheckInitialized = true;
  } catch (error) {
    console.warn("App Check could not be initialized; continuing without it.", error);
  }
}
