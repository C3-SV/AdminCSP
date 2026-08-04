import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import {
  getVirtualCardInput,
  getVirtualCardFileName,
  VIRTUAL_CARD_HEIGHT,
  VIRTUAL_CARD_WIDTH,
  VirtualCardValidationError,
} from "@/lib/cards/virtualCardLayout";
import { resolveVirtualInstructionRecipients } from "@/lib/email/virtualInstructionRecipients";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import { assertEmailDeliveryEnabled } from "@/lib/email/emailDeliveryControl";
import { buildVirtualInstructionsContent, VIRTUAL_INSTRUCTIONS_SUBJECT } from "@/lib/email/virtualInstructionsContent";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  mapRegistrationFromFirestore,
} from "@/services/admin/registrations";
import type { EmailLog, EmailLogType } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";

const REGISTRATIONS_COLLECTION = "registrations";
const EMAIL_OUTBOX_COLLECTION = "emailOutbox";
const EMAIL_LOGS_COLLECTION = "email_logs";
const MAX_CARD_BYTES = 4 * 1024 * 1024;

type ClientCardAttachment = {
  fileName: string;
  content: string;
};

type ValidatedCardAttachment = ClientCardAttachment & {
  buffer: Buffer;
  sha256: string;
};

function registrationRef(id: string) {
  return getAdminDb().collection(REGISTRATIONS_COLLECTION).doc(id);
}

function outboxRef(operationId: string) {
  return getAdminDb().collection(EMAIL_OUTBOX_COLLECTION).doc(`virtual_${operationId}`);
}

function toRegistration(snapshot: FirebaseFirestore.DocumentSnapshot): RegistrationDocument {
  if (!snapshot.exists) throw new AdminMutationError("No se encontró el equipo solicitado.", 404);
  return mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {});
}

async function readRegistration(id: string) {
  return toRegistration(await registrationRef(id).get());
}

function validateClientCardAttachment(
  attachment: ClientCardAttachment | undefined,
  registration: RegistrationDocument,
): ValidatedCardAttachment {
  if (!attachment || typeof attachment.fileName !== "string" || typeof attachment.content !== "string") {
    throw new AdminMutationError("No se recibió la tarjeta personalizada generada por el navegador.", 422);
  }
  const input = getVirtualCardInput(registration);
  if (attachment.fileName !== getVirtualCardFileName(input.teamName)) {
    throw new AdminMutationError("El nombre de la tarjeta no coincide con el equipo.", 422);
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(attachment.content) || attachment.content.length > Math.ceil(MAX_CARD_BYTES * 4 / 3) + 4) {
    throw new AdminMutationError("La tarjeta adjunta no tiene un formato válido.", 422);
  }
  const buffer = Buffer.from(attachment.content, "base64");
  if (buffer.length < 24 || buffer.length > MAX_CARD_BYTES || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new AdminMutationError("La tarjeta adjunta debe ser un PNG válido.", 422);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== VIRTUAL_CARD_WIDTH || height !== VIRTUAL_CARD_HEIGHT) {
    throw new AdminMutationError("La tarjeta adjunta no tiene las dimensiones requeridas de 1400×1750.", 422);
  }
  return { ...attachment, buffer, sha256: createHash("sha256").update(buffer).digest("hex") };
}

export function getVirtualInstructionsDeliveryMode(): "live" | "dry_run" {
  return process.env.CSP_EMAIL_DELIVERY_MODE === "live" ? "live" : "dry_run";
}

function serializeTimestamp(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return undefined;
}

function mapEmailLog(id: string, data: Record<string, unknown>): EmailLog {
  const attachment = data.attachment && typeof data.attachment === "object"
    ? (data.attachment as Record<string, unknown>)
    : null;
  const attachments = Array.isArray(data.attachments)
    ? data.attachments.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object").map((item) => ({
        name: String(item.name ?? ""), contentType: "image/png" as const, size: Number(item.size ?? 0), sha256: String(item.sha256 ?? ""),
      }))
    : undefined;
  return {
    id,
    teamId: String(data.teamId ?? ""),
    teamName: String(data.teamName ?? ""),
    emailType: data.emailType as EmailLogType,
    subject: String(data.subject ?? ""),
    to: String(data.to ?? ""),
    cc: Array.isArray(data.cc) ? data.cc.filter((email): email is string => typeof email === "string") : [],
    status: data.status as EmailLog["status"],
    brevoMessageId: typeof data.brevoMessageId === "string" ? data.brevoMessageId : undefined,
    attachment: attachment
      ? {
          name: String(attachment.name ?? ""),
          contentType: "image/png",
          size: Number(attachment.size ?? 0),
          sha256: String(attachment.sha256 ?? ""),
        }
      : undefined,
    attachments,
    errorMessage: typeof data.errorMessage === "string" ? data.errorMessage : undefined,
    createdBy: String(data.createdBy ?? ""),
    createdAt: serializeTimestamp(data.createdAt),
    sentAt: serializeTimestamp(data.sentAt),
  };
}

export async function getEmailLogsForRegistrationAsAdmin(id: string): Promise<EmailLog[]> {
  const snapshot = await getAdminDb().collection(EMAIL_LOGS_COLLECTION).where("teamId", "==", id).get();
  return snapshot.docs
    .map((document) => mapEmailLog(document.id, document.data()))
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

export async function getAllAdminEmailLogsAsAdmin(): Promise<EmailLog[]> {
  const db = getAdminDb();
  const [logsSnapshot, outboxSnapshot] = await Promise.all([
    db.collection(EMAIL_LOGS_COLLECTION).get(),
    db.collection(EMAIL_OUTBOX_COLLECTION).where("kind", "==", "admin_competitive_action").get(),
  ]);
  const logs = logsSnapshot.docs.map((document) => mapEmailLog(document.id, document.data()));
  const competitiveLogs = outboxSnapshot.docs
    .map((document): EmailLog | null => {
      const data = document.data();
      const emailType = data.action === "clasificar_presencial"
        ? "classified_to_onsite"
        : data.action === "no_clasificado"
          ? "not_classified"
          : data.action === "finalista"
            ? "finalist"
            : data.action === "ganador"
              ? "winner"
              : null;
      if (!emailType || (data.status !== "sent" && data.status !== "failed")) return null;
      return {
        id: `outbox-${document.id}`,
        teamId: String(data.registrationId ?? ""),
        teamName: String(data.teamName ?? "Equipo"),
        emailType,
        subject: String(data.action ?? "Correo operativo"),
        to: String(data.recipientEmail ?? ""),
        cc: Array.isArray(data.ccEmails) ? data.ccEmails.filter((email): email is string => typeof email === "string") : [],
        status: data.status,
        brevoMessageId: typeof data.brevoMessageId === "string" ? data.brevoMessageId : undefined,
        errorMessage: typeof data.lastError === "string" ? data.lastError : undefined,
        createdBy: String(data.createdBy ?? ""),
        createdAt: serializeTimestamp(data.createdAt),
        sentAt: serializeTimestamp(data.sentAt),
      };
    })
    .filter((log): log is EmailLog => Boolean(log));
  return [...logs, ...competitiveLogs]
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

async function persistResult({
  id,
  operationId,
  updatedBy,
  status,
  recipients,
  attachment,
  brevoMessageId,
  errorMessage,
}: {
  id: string;
  operationId: string;
  updatedBy: string;
  status: EmailLog["status"];
  recipients: NonNullable<ReturnType<typeof resolveVirtualInstructionRecipients>>;
  attachment?: { name: string; contentType: "image/png"; size: number; sha256: string };
  brevoMessageId?: string;
  errorMessage?: string;
}) {
  const db = getAdminDb();
  const logRef = db.collection(EMAIL_LOGS_COLLECTION).doc();
  const teamRef = registrationRef(id);
  const actionOutboxRef = outboxRef(operationId);
  const logData: Record<string, unknown> = {
    teamId: id,
    emailType: "virtual_instructions",
    subject: VIRTUAL_INSTRUCTIONS_SUBJECT,
    to: recipients.to.email,
    cc: recipients.cc.map((recipient) => recipient.email),
    status,
    createdBy: updatedBy,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (brevoMessageId) logData.brevoMessageId = brevoMessageId;
  if (attachment) logData.attachment = attachment;
  if (errorMessage) logData.errorMessage = errorMessage;
  if (status === "sent") logData.sentAt = FieldValue.serverTimestamp();
  await db.runTransaction(async (transaction) => {
    const team = await transaction.get(teamRef);
    transaction.create(logRef, { ...logData, teamName: team.data()?.teamName ?? "" });
    transaction.update(teamRef, {
      "emailStatus.virtualInstructions.status": status,
      "emailStatus.virtualInstructions.lastAttemptAt": FieldValue.serverTimestamp(),
      "emailStatus.virtualInstructions.lastLogId": logRef.id,
      ...(status === "sent" ? { "emailStatus.virtualInstructions.lastSentAt": FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
    transaction.set(actionOutboxRef, {
      status,
      logId: logRef.id,
      brevoMessageId: brevoMessageId ?? FieldValue.delete(),
      lastError: errorMessage ?? FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  const logSnapshot = await logRef.get();
  return mapEmailLog(logSnapshot.id, logSnapshot.data() ?? {});
}

export async function sendVirtualInstructionsAsAdmin({
  id,
  operationId,
  updatedBy,
  cardAttachment,
  sendEmail = sendBrevoEmail,
}: {
  id: string;
  operationId: string;
  updatedBy: string;
  cardAttachment?: ClientCardAttachment;
  sendEmail?: typeof sendBrevoEmail;
}) {
  const registration = await readRegistration(id);
  if (registration.status !== "aprobada") {
    throw new AdminMutationError("Sólo los equipos aprobados pueden recibir indicaciones de fase virtual.", 422);
  }
  try {
    getVirtualCardInput(registration);
  } catch (error) {
    throw new AdminMutationError(
      error instanceof VirtualCardValidationError ? error.message : "Los datos de la tarjeta son inválidos.",
      422,
    );
  }
  const recipients = resolveVirtualInstructionRecipients(registration);
  if (!recipients) {
    throw new AdminMutationError("El equipo no tiene un correo válido para notificar.", 422);
  }
  let content;
  try {
    content = buildVirtualInstructionsContent(registration);
  } catch (error) {
    throw new AdminMutationError(
      error instanceof Error ? error.message : "No fue posible preparar el contenido del correo.",
      503,
    );
  }

  const actionOutboxRef = outboxRef(operationId);
  const existing = await actionOutboxRef.get();
  if (existing.exists) {
    const record = existing.data() ?? {};
    if (record.registrationId !== id || record.kind !== "virtual_instructions") {
      throw new AdminMutationError("La operación no coincide con el equipo solicitado.", 409);
    }
    if (record.status === "sent" || record.status === "dry_run") {
      return { registration: await readRegistration(id), alreadyProcessed: true };
    }
    throw new AdminMutationError("Esta operación ya fue procesada. Genera una nueva para reintentar.", 409);
  }

  await actionOutboxRef.create({
    kind: "virtual_instructions",
    registrationId: id,
    status: "processing",
    recipientEmail: recipients.to.email,
    ccEmails: recipients.cc.map((recipient) => recipient.email),
    contentMode: "inline_html",
    createdBy: updatedBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    attempts: 1,
  });

  let card: ValidatedCardAttachment | undefined;
  try {
    await assertEmailDeliveryEnabled();
    card = validateClientCardAttachment(cardAttachment, registration);
    const mode = getVirtualInstructionsDeliveryMode();
    const result = await sendEmail({
      to: recipients.to,
      cc: recipients.cc,
      ...content,
      attachment: { name: card.fileName, content: card.content },
      idempotencyKey: operationId,
      sandbox: mode === "dry_run",
    });
    const status = mode === "live" ? "sent" : "dry_run";
    const log = await persistResult({
      id,
      operationId,
      updatedBy,
      status,
      recipients,
      attachment: { name: card.fileName, contentType: "image/png", size: card.buffer.length, sha256: card.sha256 },
      brevoMessageId: result.messageId,
    });
    return { registration: await readRegistration(id), log, alreadyProcessed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible enviar las indicaciones.";
    const log = await persistResult({
      id,
      operationId,
      updatedBy,
      status: "failed",
      recipients,
      attachment: card
        ? { name: card.fileName, contentType: "image/png", size: card.buffer.length, sha256: card.sha256 }
        : undefined,
      errorMessage: message,
    });
    throw new AdminMutationError(`No fue posible enviar las indicaciones. Se registró el fallo (${log.id}).`, 502);
  }
}
