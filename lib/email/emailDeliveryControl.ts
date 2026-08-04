import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const SETTINGS_COLLECTION = "system_settings";
const SETTINGS_DOCUMENT = "email_delivery";

export type EmailDeliverySettings = {
  enabled: boolean;
  updatedBy?: string;
  updatedAt?: string;
};

function settingsRef() {
  return getAdminDb().collection(SETTINGS_COLLECTION).doc(SETTINGS_DOCUMENT);
}

function serializeTimestamp(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
  return undefined;
}

export async function getEmailDeliverySettings(): Promise<EmailDeliverySettings> {
  const snapshot = await settingsRef().get();
  const data = snapshot.data() ?? {};
  return {
    enabled: data.enabled === true,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : undefined,
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export async function setEmailDeliveryEnabled(enabled: boolean, updatedBy: string): Promise<EmailDeliverySettings> {
  const ref = settingsRef();
  await ref.set({ enabled, updatedBy, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return getEmailDeliverySettings();
}

export async function assertEmailDeliveryEnabled() {
  const settings = await getEmailDeliverySettings();
  if (!settings.enabled) {
    throw new Error("El envío de correos está desactivado globalmente desde Configuración.");
  }
  return settings;
}
