import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

function getRequiredEnv(
  name: "FIREBASE_PROJECT_ID" | "FIREBASE_CLIENT_EMAIL" | "FIREBASE_PRIVATE_KEY",
) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let firestoreDb: Firestore | null = null;

export function getAdminDb() {
  if (firestoreDb) {
    return firestoreDb;
  }

  const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  firestoreDb = getFirestore();
  return firestoreDb;
}

export const db = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getAdminDb(), prop, receiver);
    return typeof value === "function" ? value.bind(getAdminDb()) : value;
  },
});
