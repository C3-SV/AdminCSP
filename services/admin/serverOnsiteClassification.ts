import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getOnsiteFinalistFileName, ONSITE_FINALIST_CARD_HEIGHT, ONSITE_FINALIST_CARD_WIDTH } from "@/lib/cards/onsiteFinalistCardLayout";
import { getVirtualCardInput, VirtualCardValidationError } from "@/lib/cards/virtualCardLayout";
import { resolveVirtualInstructionRecipients } from "@/lib/email/virtualInstructionRecipients";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import { buildOnsiteClassificationContent, ONSITE_CLASSIFICATION_SUBJECT } from "@/lib/email/onsiteClassificationContent";
import { getAdminDb } from "@/lib/firebase/admin";
import { mapRegistrationFromFirestore } from "@/services/admin/registrations";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import type { EmailLog } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";

type ClientCardAttachment = { fileName: string; content: string };
type ValidatedAttachment = ClientCardAttachment & { buffer: Buffer; sha256: string };
const MAX_CARD_BYTES = 4 * 1024 * 1024;

function teamRef(id: string) { return getAdminDb().collection("registrations").doc(id); }
function outboxRef(operationId: string) { return getAdminDb().collection("emailOutbox").doc(`onsite_${operationId}`); }
function mapRegistration(snapshot: FirebaseFirestore.DocumentSnapshot): RegistrationDocument {
  if (!snapshot.exists) throw new AdminMutationError("No se encontró el equipo solicitado.", 404);
  return mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {});
}
async function readRegistration(id: string) { return mapRegistration(await teamRef(id).get()); }

function validateAttachment(attachment: ClientCardAttachment | undefined, registration: RegistrationDocument): ValidatedAttachment {
  if (!attachment || typeof attachment.fileName !== "string" || typeof attachment.content !== "string") throw new AdminMutationError("No se recibió la tarjeta presencial generada por el navegador.", 422);
  const input = getVirtualCardInput(registration);
  if (attachment.fileName !== getOnsiteFinalistFileName(input.teamName)) throw new AdminMutationError("El nombre de la tarjeta no coincide con el equipo.", 422);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(attachment.content) || attachment.content.length > Math.ceil(MAX_CARD_BYTES * 4 / 3) + 4) throw new AdminMutationError("La tarjeta adjunta no tiene un formato válido.", 422);
  const buffer = Buffer.from(attachment.content, "base64");
  if (buffer.length < 24 || buffer.length > MAX_CARD_BYTES || buffer.toString("ascii", 1, 4) !== "PNG") throw new AdminMutationError("La tarjeta adjunta debe ser un PNG válido.", 422);
  if (buffer.readUInt32BE(16) !== ONSITE_FINALIST_CARD_WIDTH || buffer.readUInt32BE(20) !== ONSITE_FINALIST_CARD_HEIGHT) throw new AdminMutationError("La tarjeta presencial debe medir 1080×1350.", 422);
  return { ...attachment, buffer, sha256: createHash("sha256").update(buffer).digest("hex") };
}

function deliveryMode() { return process.env.CSP_EMAIL_DELIVERY_MODE === "live" ? "live" as const : "dry_run" as const; }

async function persist({ id, operationId, updatedBy, recipients, status, attachment, messageId, errorMessage }: {
  id: string; operationId: string; updatedBy: string; recipients: NonNullable<ReturnType<typeof resolveVirtualInstructionRecipients>>;
  status: "sent" | "failed" | "dry_run"; attachment?: ValidatedAttachment; messageId?: string; errorMessage?: string;
}): Promise<EmailLog> {
  const db = getAdminDb(); const logRef = db.collection("email_logs").doc(); const ref = teamRef(id);
  await db.runTransaction(async (transaction) => {
    const team = await transaction.get(ref);
    transaction.create(logRef, {
      teamId: id, teamName: team.data()?.teamName ?? "", emailType: "classified_to_onsite", subject: ONSITE_CLASSIFICATION_SUBJECT,
      to: recipients.to.email, cc: recipients.cc.map((recipient) => recipient.email), status, createdBy: updatedBy,
      createdAt: FieldValue.serverTimestamp(), ...(status === "sent" ? { sentAt: FieldValue.serverTimestamp() } : {}),
      ...(messageId ? { brevoMessageId: messageId } : {}), ...(errorMessage ? { errorMessage } : {}),
      ...(attachment ? { attachment: { name: attachment.fileName, contentType: "image/png", size: attachment.buffer.length, sha256: attachment.sha256 } } : {}),
    });
    transaction.update(ref, {
      "emailStatus.classifiedToOnsite.status": status, "emailStatus.classifiedToOnsite.lastAttemptAt": FieldValue.serverTimestamp(),
      "emailStatus.classifiedToOnsite.lastLogId": logRef.id, ...(status === "sent" ? { "emailStatus.classifiedToOnsite.lastSentAt": FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(), updatedBy,
    });
    transaction.set(outboxRef(operationId), { status, logId: logRef.id, updatedAt: FieldValue.serverTimestamp(), ...(messageId ? { brevoMessageId: messageId } : {}), ...(errorMessage ? { lastError: errorMessage } : {}) }, { merge: true });
  });
  const data = (await logRef.get()).data() ?? {};
  return { id: logRef.id, teamId: id, teamName: String(data.teamName ?? ""), emailType: "classified_to_onsite", subject: ONSITE_CLASSIFICATION_SUBJECT, to: recipients.to.email, cc: recipients.cc.map((recipient) => recipient.email), status, createdBy: updatedBy, attachment: attachment ? { name: attachment.fileName, contentType: "image/png", size: attachment.buffer.length, sha256: attachment.sha256 } : undefined, errorMessage, brevoMessageId: messageId };
}

export async function sendOnsiteClassificationAsAdmin({ id, operationId, updatedBy, cardAttachment, sendEmail = sendBrevoEmail }: {
  id: string; operationId: string; updatedBy: string; cardAttachment?: ClientCardAttachment; sendEmail?: typeof sendBrevoEmail;
}) {
  const registration = await readRegistration(id);
  if (registration.estadoCompetitivo !== "clasificado") throw new AdminMutationError("Sólo los equipos clasificados pueden recibir el correo de fase presencial.", 422);
  try { getVirtualCardInput(registration); } catch (error) { throw new AdminMutationError(error instanceof VirtualCardValidationError ? error.message : "Los datos de la tarjeta son inválidos.", 422); }
  const recipients = resolveVirtualInstructionRecipients(registration);
  if (!recipients) throw new AdminMutationError("El equipo no tiene un correo válido para notificar.", 422);
  const existing = await outboxRef(operationId).get();
  if (existing.exists) {
    const record = existing.data() ?? {};
    if (record.registrationId !== id || record.kind !== "onsite_classification") throw new AdminMutationError("La operación no coincide con el equipo solicitado.", 409);
    if (record.status === "sent" || record.status === "dry_run") return { registration: await readRegistration(id), alreadyProcessed: true };
    throw new AdminMutationError("Esta operación ya fue procesada. Genera una nueva para reintentar.", 409);
  }
  await outboxRef(operationId).create({ kind: "onsite_classification", registrationId: id, status: "processing", createdBy: updatedBy, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  let attachment: ValidatedAttachment | undefined;
  try {
    attachment = validateAttachment(cardAttachment, registration);
    const result = await sendEmail({ to: recipients.to, cc: recipients.cc, ...buildOnsiteClassificationContent(registration), attachment: { name: attachment.fileName, content: attachment.content }, idempotencyKey: operationId, sandbox: deliveryMode() === "dry_run" });
    const status = deliveryMode() === "live" ? "sent" : "dry_run";
    const log = await persist({ id, operationId, updatedBy, recipients, status, attachment, messageId: result.messageId });
    return { registration: await readRegistration(id), log, alreadyProcessed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible enviar el correo de clasificación.";
    const log = await persist({ id, operationId, updatedBy, recipients, status: "failed", attachment, errorMessage: message });
    throw new AdminMutationError(`No fue posible enviar el correo de clasificación. Se registró el fallo (${log.id}).`, 502);
  }
}
