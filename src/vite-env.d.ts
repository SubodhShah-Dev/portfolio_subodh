/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Firebase client config — public values that ship in the browser bundle. */
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** "true" routes Auth/Firestore/Storage to the local Emulator Suite. */
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  /** Canonical production URL, no trailing slash. */
  readonly VITE_SITE_URL?: string;
  /** Optional App Check site key; empty disables App Check. */
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
