import { FirebaseApp, initializeApp, getApps, getApp } from "firebase/app";
import { Auth, GoogleAuthProvider, getAuth } from "firebase/auth";
import { Firestore, FirestoreSettings, getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys: (keyof typeof firebaseConfig)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

export const isFirebaseConfigured = requiredKeys.every((key) => Boolean(firebaseConfig[key]));

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

type ExtendedFirestoreSettings = FirestoreSettings & { useFetchStreams?: boolean };

const firestoreSettings: ExtendedFirestoreSettings = {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
};

export const getFirebaseApp = () => {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase configuration is missing. Check NEXT_PUBLIC_FIREBASE_* env vars.");
  }

  if (appInstance) return appInstance;

  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }

  return appInstance;
};

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());

export const getGoogleProvider = () => new GoogleAuthProvider();

export const getDb = (): Firestore => {
  if (firestoreInstance) return firestoreInstance;

  const app = getFirebaseApp();

  // Next.js can render components on the server, so guard against SSR usage.
  if (typeof window === "undefined") {
    firestoreInstance = getFirestore(app);
  } else {
    firestoreInstance = initializeFirestore(app, firestoreSettings);
  }

  return firestoreInstance;
};
