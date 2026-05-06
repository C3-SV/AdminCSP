import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
  .map(([key]) => key);

const placeholderEnvKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => typeof value === "string" && placeholderValues.has(value.trim()))
  .map(([key]) => key);

const invalidEnvKeys = [...new Set([...missingEnvKeys, ...placeholderEnvKeys])];

export const firebaseConfigDiagnostics = {
  missingEnvKeys,
  placeholderEnvKeys,
  invalidEnvKeys,
};

export const isFirebaseConfigured = invalidEnvKeys.length === 0;

if (!isFirebaseConfigured) {
  const details: string[] = [];
  if (missingEnvKeys.length) {
    details.push(`faltantes: ${missingEnvKeys.join(", ")}`);
  }
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
const firebaseStorage: FirebaseStorage | null = firebaseApp
  ? getStorage(firebaseApp)
  : null;

export { firebaseApp as app, firestoreDb as db, firebaseStorage as storage };
