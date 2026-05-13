import {
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { AdminAllowlistEntry, AdminAllowlistRole } from "@/types/admin/auth";

export const ADMIN_ALLOWLIST_COLLECTION = "admin_allowlist";

type CreateAllowlistEntryInput = {
  email: string;
  role: AdminAllowlistRole;
  actorEmail: string;
};

type UpdateAllowlistRoleInput = {
  email: string;
  role: AdminAllowlistRole;
  actorEmail: string;
};

type UpdateAllowlistActiveInput = {
  email: string;
  active: boolean;
  actorEmail: string;
};

function ensureFirestoreConfigured() {
  if (!db || !isFirebaseConfigured) {
    throw new Error("Firestore no esta disponible. Revisa la configuracion de Firebase.");
  }
}

function getFirestoreOrThrow(): Firestore {
  ensureFirestoreConfigured();
  return db as Firestore;
}

function toISODate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return undefined;
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapAllowlistEntry(
  documentId: string,
  data: Record<string, unknown>,
): AdminAllowlistEntry {
  const email = normalizeAdminEmail(String(data.email ?? documentId));

  return {
    id: documentId,
    email,
    role: data.role === "owner" ? "owner" : "admin",
    active: Boolean(data.active),
    createdAt: toISODate(data.createdAt),
    updatedAt: toISODate(data.updatedAt),
    createdBy: typeof data.createdBy === "string" ? data.createdBy : undefined,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : undefined,
  };
}

export async function getAllowlistEntryByEmail(email: string) {
  const firestore = getFirestoreOrThrow();
  const normalizedEmail = normalizeAdminEmail(email);
  const snapshot = await getDoc(doc(firestore, ADMIN_ALLOWLIST_COLLECTION, normalizedEmail));
  if (!snapshot.exists()) return null;
  return mapAllowlistEntry(snapshot.id, snapshot.data());
}

export async function resolveAdminAuthorization(email: string) {
  const entry = await getAllowlistEntryByEmail(email);
  return {
    entry,
    authorized: Boolean(entry?.active),
  };
}

export async function listAllowlistEntries() {
  const firestore = getFirestoreOrThrow();
  const snapshot = await getDocs(
    query(collection(firestore, ADMIN_ALLOWLIST_COLLECTION), orderBy("email", "asc")),
  );
  return snapshot.docs.map((entryDoc) => mapAllowlistEntry(entryDoc.id, entryDoc.data()));
}

export async function createAllowlistEntry({
  email,
  role,
  actorEmail,
}: CreateAllowlistEntryInput) {
  const firestore = getFirestoreOrThrow();

  const normalizedEmail = normalizeAdminEmail(email);
  const normalizedActor = normalizeAdminEmail(actorEmail);
  const targetDoc = doc(firestore, ADMIN_ALLOWLIST_COLLECTION, normalizedEmail);

  await setDoc(targetDoc, {
    email: normalizedEmail,
    role,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: normalizedActor,
    updatedBy: normalizedActor,
  });
}

export async function updateAllowlistEntryRole({
  email,
  role,
  actorEmail,
}: UpdateAllowlistRoleInput) {
  const firestore = getFirestoreOrThrow();

  const normalizedEmail = normalizeAdminEmail(email);
  await updateDoc(doc(firestore, ADMIN_ALLOWLIST_COLLECTION, normalizedEmail), {
    role,
    updatedAt: serverTimestamp(),
    updatedBy: normalizeAdminEmail(actorEmail),
  });
}

export async function updateAllowlistEntryActive({
  email,
  active,
  actorEmail,
}: UpdateAllowlistActiveInput) {
  const firestore = getFirestoreOrThrow();

  const normalizedEmail = normalizeAdminEmail(email);
  await updateDoc(doc(firestore, ADMIN_ALLOWLIST_COLLECTION, normalizedEmail), {
    active,
    updatedAt: serverTimestamp(),
    updatedBy: normalizeAdminEmail(actorEmail),
  });
}
