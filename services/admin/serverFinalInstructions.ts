import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { assertEmailDeliveryEnabled } from "@/lib/email/emailDeliveryControl";
import { FINAL_INSTRUCTIONS_SUBJECT, buildFinalInstructionsContent } from "@/lib/email/finalInstructionsContent";
import { getFinalInstructionsEligibilityError } from "@/lib/email/finalInstructionsEligibility";
import { resolveVirtualInstructionRecipients } from "@/lib/email/virtualInstructionRecipients";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import { getAdminDb } from "@/lib/firebase/admin";
import { mapRegistrationFromFirestore } from "@/services/admin/registrations";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import type { EmailLog } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";

type FinalInstructionsAttachment = {
  name: string;
  content: string;
  contentType: "image/png";
  size: number;
  sha256: string;
};

function registrationRef(id: string) { return getAdminDb().collection("registrations").doc(id); }
function outboxRef(operationId: string) { return getAdminDb().collection("emailOutbox").doc(`final_instructions_${operationId}`); }
function deliveryMode() { return process.env.CSP_EMAIL_DELIVERY_MODE === "live" ? "live" as const : "dry_run" as const; }

async function readRegistration(id: string): Promise<RegistrationDocument> {
  const snapshot = await registrationRef(id).get();
  if (!snapshot.exists) throw new AdminMutationError("No se encontró el equipo solicitado.", 404);
  return mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {});
}
async function loadAttachment(pathName: string | undefined, fileName: string | undefined): Promise<FinalInstructionsAttachment | undefined> {
  if (!pathName || !fileName) return undefined;
  const buffer = await readFile(path.join(process.cwd(), pathName));
  return {
    name: fileName,
    content: buffer.toString("base64"),
    contentType: "image/png",
    size: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

function attachmentMetadata(attachment: FinalInstructionsAttachment) {
  return { name: attachment.name, contentType: attachment.contentType, size: attachment.size, sha256: attachment.sha256 };
}

async function persistEmailResult({
  id,
  operationId,
  updatedBy,
  recipients,
  subject,
  status,
  attachment,
  messageId,
  errorMessage,
}: {
  id: string;
  operationId: string;
  updatedBy: string;
  recipients: NonNullable<ReturnType<typeof resolveVirtualInstructionRecipients>>;
  subject: string;
  status: "sent" | "failed" | "dry_run";
  attachment?: FinalInstructionsAttachment;
  messageId?: string;
  errorMessage?: string;
}): Promise<EmailLog> {
  const db = getAdminDb();
  const logRef = db.collection("email_logs").doc();
  const teamRef = registrationRef(id);
  const metadata = attachment ? attachmentMetadata(attachment) : undefined;

  await db.runTransaction(async (transaction) => {
    const team = await transaction.get(teamRef);
    transaction.create(logRef, {
      teamId: id,
      teamName: team.data()?.teamName ?? "",
      emailType: "final_instructions",
      subject,
      to: recipients.to.email,
      cc: recipients.cc.map((recipient) => recipient.email),
      status,
      createdBy: updatedBy,
      createdAt: FieldValue.serverTimestamp(),
      ...(status === "sent" ? { sentAt: FieldValue.serverTimestamp() } : {}),
      ...(messageId ? { brevoMessageId: messageId } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(metadata ? { attachment: metadata, attachments: [metadata] } : {}),
    });
    transaction.update(teamRef, {
      "emailStatus.finalInstructions.status": status,
      "emailStatus.finalInstructions.lastAttemptAt": FieldValue.serverTimestamp(),
      "emailStatus.finalInstructions.lastLogId": logRef.id,
      ...(status === "sent" ? { "emailStatus.finalInstructions.lastSentAt": FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
    transaction.set(outboxRef(operationId), {
      status,
      logId: logRef.id,
      updatedAt: FieldValue.serverTimestamp(),
      ...(messageId ? { brevoMessageId: messageId } : {}),
      ...(errorMessage ? { lastError: errorMessage } : {}),
    }, { merge: true });
  });

  return {
    id: logRef.id,
    teamId: id,
    teamName: (await readRegistration(id)).teamName,
    emailType: "final_instructions",
    subject,
    to: recipients.to.email,
    cc: recipients.cc.map((recipient) => recipient.email),
    status,
    createdBy: updatedBy,
    attachment: metadata,
    attachments: metadata ? [metadata] : undefined,
    errorMessage,
    brevoMessageId: messageId,
  };
}

export async function sendFinalInstructionsAsAdmin({ id, operationId, updatedBy, sendEmail = sendBrevoEmail }: {
  id: string;
  operationId: string;
  updatedBy: string;
  sendEmail?: typeof sendBrevoEmail;
}) {
  const registration = await readRegistration(id);
  const eligibilityError = getFinalInstructionsEligibilityError(registration);
  if (eligibilityError) throw new AdminMutationError(eligibilityError, 422);
  const recipients = resolveVirtualInstructionRecipients(registration);
  if (!recipients) throw new AdminMutationError("El equipo no tiene un correo válido para notificar.", 422);
  const existing = await outboxRef(operationId).get();
  if (existing.exists) {
    const record = existing.data() ?? {};
    if (record.registrationId !== id || record.kind !== "final_instructions") throw new AdminMutationError("La operación no coincide con el equipo solicitado.", 409);
    if (record.status === "sent" || record.status === "dry_run") return { registration: await readRegistration(id), alreadyProcessed: true };
    throw new AdminMutationError("Esta operación ya fue procesada. Genera una nueva para reintentar.", 409);
  }
  await outboxRef(operationId).create({ kind: "final_instructions", registrationId: id, status: "processing", createdBy: updatedBy, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });

  let subject = FINAL_INSTRUCTIONS_SUBJECT;
  let attachment: FinalInstructionsAttachment | undefined;
  try {
    const content = buildFinalInstructionsContent(registration);
    subject = content.subject;
    attachment = await loadAttachment(content.attachmentPath, content.attachmentName);
    await assertEmailDeliveryEnabled();
    const result = await sendEmail({
      to: recipients.to,
      cc: recipients.cc,
      subject: content.subject,
      htmlContent: content.htmlContent,
      textContent: content.textContent,
      ...(attachment ? { attachments: [{ name: attachment.name, content: attachment.content }] } : {}),
      idempotencyKey: operationId,
      sandbox: deliveryMode() === "dry_run",
    });
    const status = deliveryMode() === "live" ? "sent" : "dry_run";
    const log = await persistEmailResult({ id, operationId, updatedBy, recipients, subject: content.subject, status, attachment, messageId: result.messageId });
    return { registration: await readRegistration(id), log, alreadyProcessed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible enviar las indicaciones finales.";
    const log = await persistEmailResult({ id, operationId, updatedBy, recipients, subject, status: "failed", attachment, errorMessage: message });
    throw new AdminMutationError(`No fue posible enviar las indicaciones finales. Se registró el fallo (${log.id}).`, 502);
  }
}
