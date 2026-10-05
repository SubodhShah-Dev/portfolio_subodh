import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { auth } from "../config/firebase";
import { verifyAdminAccess } from "../services/adminService";
import { getFirebaseCode, createAppError, toAppError } from "../utils/firebaseErrors";
import type { AppError } from "../types/common";
import type { User } from "firebase/auth";

/** Overall authentication lifecycle (§43). */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Administrator authorization lifecycle — tracked separately from auth so
 * ProtectedRoute can distinguish "checking", "denied", and "verification
 * failed" (§31).
 */
export type AdminStatus = "idle" | "checking" | "verified" | "denied" | "error";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  adminStatus: AdminStatus;
  /** Safe, normalized error from the last admin verification attempt. */
  adminError: AppError | null;
  /** Throws a safe AppError on failure — never a raw Firebase exception. */
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  /** Re-runs admin verification (retry after a transient failure). */
  recheckAdmin: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const CREDENTIAL_ERROR_CODES: ReadonlySet<string> = new Set([
  "auth/invalid-credential",
  "auth/invalid-email",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/wrong-password",
  "auth/missing-password",
]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>("idle");
  const [adminError, setAdminError] = useState<AppError | null>(null);

  const runAdminCheck = useCallback(async (uid: string): Promise<void> => {
    setAdminStatus("checking");
    setAdminError(null);
    try {
      const isVerified = await verifyAdminAccess(uid);
      setAdminStatus(isVerified ? "verified" : "denied");
    } catch (error) {
      setAdminStatus("error");
      setAdminError(toAppError(error));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setStatus(firebaseUser !== null ? "authenticated" : "unauthenticated");
      if (firebaseUser !== null) {
        // Authorization check runs in the auth callback (not an effect body):
        // one Firestore read per sign-in, never realtime (§28).
        void runAdminCheck(firebaseUser.uid);
      } else {
        setAdminStatus("idle");
        setAdminError(null);
      }
    });
    return unsubscribe;
  }, [runAdminCheck]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const code = getFirebaseCode(error);
      if (code !== null && CREDENTIAL_ERROR_CODES.has(code)) {
        throw createAppError("unauthenticated", "Incorrect email or password.", error);
      }
      throw toAppError(error);
    }
  }, []);

  const signOutUser = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      throw toAppError(error);
    }
  }, []);

  const recheckAdmin = useCallback(async (): Promise<void> => {
    const currentUid = user?.uid ?? null;
    if (currentUid !== null) {
      await runAdminCheck(currentUid);
    }
  }, [user, runAdminCheck]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      adminStatus,
      adminError,
      signIn,
      signOutUser,
      recheckAdmin,
    }),
    [status, user, adminStatus, adminError, signIn, signOutUser, recheckAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Context accessor — use through hooks/useAuth. */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
