import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { assertEmailDeliveryEnabled } from "@/lib/email/emailDeliveryControl";
import { buildFinalInstructionsContent } from "@/lib/email/finalInstructionsContent";
import { getFinalInstructionsEligibilityError } from "@/lib/email/finalInstructionsEligibility";
import { resolveVirtualInstructionRecipients } from "@/lib/email/virtualInstructionRecipients";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import { getAdminDb } from "@/lib/firebase/admin";
import { mapRegistrationFromFirestore } from "@/services/admin/registrations";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import type { EmailLog } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";

function registrationRef(id: string) { return getAdminDb().collection("registrations").doc(id); }
function outboxRef(operationId: string) { return getAdminDb().collection("emailOutbox").doc(`final_instructions_${operationId}`); }
function deliveryMode() { return process.env.CSP_EMAIL_DELIVERY_MODE === "live" ? "live" as const : "dry_run" as const; }

async function readRegistration(id: string): Promise<RegistrationDocument> {
  const snapshot = await registrationRef(id).get();
  if (!snapshot.exists) throw new AdminMutationError("No se encontró el equipo solicitado.", 404);
  return mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {});
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
  const content = buildFinalInstructionsContent(registration);
  try {
    await assertEmailDeliveryEnabled();
    const result = await sendEmail({ to: recipients.to, cc: recipients.cc, ...content, idempotencyKey: operationId, sandbox: deliveryMode() === "dry_run" });
    const status = deliveryMode() === "live" ? "sent" : "dry_run";
    const logRef = getAdminDb().collection("email_logs").doc();
    await getAdminDb().runTransaction(async (transaction) => {
      const team = await transaction.get(registrationRef(id));
      transaction.create(logRef, { teamId: id, teamName: team.data()?.teamName ?? "", emailType: "final_instructions", subject: content.subject, to: recipients.to.email, cc: recipients.cc.map((recipient) => recipient.email), status, createdBy: updatedBy, createdAt: FieldValue.serverTimestamp(), ...(status === "sent" ? { sentAt: FieldValue.serverTimestamp() } : {}), ...(result.messageId ? { brevoMessageId: result.messageId } : {}) });
      transaction.update(registrationRef(id), { "emailStatus.finalInstructions.status": status, "emailStatus.finalInstructions.lastAttemptAt": FieldValue.serverTimestamp(), "emailStatus.finalInstructions.lastLogId": logRef.id, ...(status === "sent" ? { "emailStatus.finalInstructions.lastSentAt": FieldValue.serverTimestamp() } : {}), updatedAt: FieldValue.serverTimestamp(), updatedBy });
      transaction.set(outboxRef(operationId), { status, logId: logRef.id, updatedAt: FieldValue.serverTimestamp(), ...(result.messageId ? { brevoMessageId: result.messageId } : {}) }, { merge: true });
    });
    const log: EmailLog = { id: logRef.id, teamId: id, teamName: registration.teamName, emailType: "final_instructions", subject: content.subject, to: recipients.to.email, cc: recipients.cc.map((recipient) => recipient.email), status, createdBy: updatedBy, brevoMessageId: result.messageId };
    return { registration: await readRegistration(id), log, alreadyProcessed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible enviar las indicaciones finales.";
    const logRef = getAdminDb().collection("email_logs").doc();
    await getAdminDb().runTransaction(async (transaction) => {
      const team = await transaction.get(registrationRef(id));
      transaction.create(logRef, { teamId: id, teamName: team.data()?.teamName ?? "", emailType: "final_instructions", subject: content.subject, to: recipients.to.email, cc: recipients.cc.map((recipient) => recipient.email), status: "failed", errorMessage: message, createdBy: updatedBy, createdAt: FieldValue.serverTimestamp() });
      transaction.update(registrationRef(id), { "emailStatus.finalInstructions.status": "failed", "emailStatus.finalInstructions.lastAttemptAt": FieldValue.serverTimestamp(), "emailStatus.finalInstructions.lastLogId": logRef.id, updatedAt: FieldValue.serverTimestamp(), updatedBy });
      transaction.set(outboxRef(operationId), { status: "failed", logId: logRef.id, lastError: message, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    throw new AdminMutationError(`No fue posible enviar las indicaciones finales. Se registró el fallo (${logRef.id}).`, 502);
  }
}
