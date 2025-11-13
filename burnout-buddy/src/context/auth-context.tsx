"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { AUTH_STORAGE_KEY } from "@/lib/storage";
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from "@/lib/firebase/client";
import { SessionType, UserProfile } from "@/types";

interface AuthContextValue {
  user: UserProfile | null;
  sessionType: SessionType | null;
  loading: boolean;
  error: string | null;
  startDemo: (displayName?: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface StoredAuth {
  sessionType: SessionType;
  user?: UserProfile | null;
}

const readStoredAuth = (): StoredAuth | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch (error) {
    console.warn("Unable to parse stored auth state", error);
    return null;
  }
};

const writeStoredAuth = (auth: StoredAuth | null) => {
  if (typeof window === "undefined") return;
  if (!auth) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored?.sessionType === "demo") {
      setSessionType("demo");
      setUser(
        stored.user ?? {
          uid: "demo",
          displayName: stored?.user?.displayName ?? "Dr. Demo",
        }
      );
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? "Doctor",
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          };
          setUser(profile);
          setSessionType("firebase");
          writeStoredAuth({ sessionType: "firebase", user: profile });
        } else {
          setUser(null);
          setSessionType(null);
          writeStoredAuth(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (authError) {
      console.error("Failed to initialise Firebase auth", authError);
      setError("Unable to connect to Firebase. Check configuration.");
      setLoading(false);
    }
  }, []);

  const startDemo = useCallback((displayName?: string) => {
    const demoUser: UserProfile = {
      uid: "demo",
      displayName: displayName?.trim() || "Dr. Demo",
    };
    setUser(demoUser);
    setSessionType("demo");
    writeStoredAuth({ sessionType: "demo", user: demoUser });
    setError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setError("Google sign-in requires Firebase configuration. Try the demo instead.");
      throw new Error("Firebase not configured");
    }

    try {
      setLoading(true);
      setError(null);
      const auth = getFirebaseAuth();
      const provider = getGoogleProvider();
      await signInWithPopup(auth, provider);
      setSessionType("firebase");
    } catch (authError) {
      console.error("Google sign-in failed", authError);
      setError("Google sign-in was interrupted. Please try again.");
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (sessionType === "firebase" && isFirebaseConfigured) {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    }
    setUser(null);
    setSessionType(null);
    setError(null);
    writeStoredAuth(null);
  }, [sessionType]);

  const value = useMemo(
    () => ({
      user,
      sessionType,
      loading,
      error,
      startDemo,
      signInWithGoogle,
      signOut,
      isDemo: sessionType === "demo",
    }),
    [user, sessionType, loading, error, startDemo, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
