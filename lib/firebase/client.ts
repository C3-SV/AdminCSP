import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const firebaseConfig = {
  apiKey: firebaseEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const configKeyToEnvKey: Record<keyof typeof firebaseConfig, keyof typeof firebaseEnv> = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

const placeholderValues = new Set([
  "tu_api_key",
  "tu-proyecto.firebaseapp.com",
  "tu-proyecto",
  "tu-proyecto.appspot.com",
  "1234567890",
  "1:1234567890:web:abcdef123456",
]);

const missingEnvKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => configKeyToEnvKey[key as keyof typeof firebaseConfig]);

const placeholderEnvKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => typeof value === "string" && placeholderValues.has(value.trim()))
  .map(([key]) => configKeyToEnvKey[key as keyof typeof firebaseConfig]);

const invalidEnvKeys = [...new Set([...missingEnvKeys, ...placeholderEnvKeys])];

export const firebaseConfigDiagnostics = {
  missingEnvKeys,
  placeholderEnvKeys,
  invalidEnvKeys,
};

export const isFirebaseConfigured = invalidEnvKeys.length === 0;

if (!isFirebaseConfigured) {
  const details: string[] = [];
  if (missingEnvKeys.length) details.push(`faltantes: ${missingEnvKeys.join(", ")}`);
  if (placeholderEnvKeys.length) {
    details.push(`placeholders: ${placeholderEnvKeys.join(", ")}`);
  }
  console.warn(
    `[Firebase] Configuracion incompleta (${details.join(" | ")}). Revisa .env.local.`,
  );
}

const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const firestoreDb: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export { firebaseApp as app, firestoreDb as db, firebaseAuth as auth };
