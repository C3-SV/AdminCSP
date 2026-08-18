import "server-only";

import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { generateTeamDiplomas, type DiplomaPhase, type ParticipantDiploma } from "@/lib/diplomas/teamDiplomas";
import { assertEmailDeliveryEnabled } from "@/lib/email/emailDeliveryControl";
import { buildDiplomaEmailContent } from "@/lib/email/diplomaContent";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import { resolveVirtualInstructionRecipients } from "@/lib/email/virtualInstructionRecipients";
import { getAdminDb } from "@/lib/firebase/admin";
import { mapRegistrationFromFirestore } from "@/services/admin/registrations";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import type { EmailLog, EmailLogType, RegistrationEmailStatus } from "@/types/admin/email";
import type { RegistrationDocument } from "@/types/admin/registration";

const REGISTRATIONS_COLLECTION = "registrations";
const EMAIL_LOGS_COLLECTION = "email_logs";

function teamRef(id: string) { return getAdminDb().collection(REGISTRATIONS_COLLECTION).doc(id); }
function outboxRef(phase: DiplomaPhase, operationId: string) { return getAdminDb().collection("emailOutbox").doc(`diplomas_${phase}_${operationId}`); }
function emailTypeFor(phase: DiplomaPhase): EmailLogType { return phase === "virtual" ? "diplomas_virtual" : "diplomas_presencial"; }
function emailStatusKeyFor(phase: DiplomaPhase): keyof Pick<RegistrationEmailStatus, "diplomasVirtual" | "diplomasPresencial"> { return phase === "virtual" ? "diplomasVirtual" : "diplomasPresencial"; }
function deliveryMode() { return process.env.CSP_EMAIL_DELIVERY_MODE === "live" ? "live" as const : "dry_run" as const; }

function mapRegistration(snapshot: FirebaseFirestore.DocumentSnapshot): RegistrationDocument {
  if (!snapshot.exists) throw new AdminMutationError("No se encontró el equipo solicitado.", 404);
  return mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {});
}

async function readRegistration(id: string) { return mapRegistration(await teamRef(id).get()); }

function assertEligible(registration: RegistrationDocument, phase: DiplomaPhase) {
  if (registration.status !== "aprobada") throw new AdminMutationError("Sólo los equipos aprobados pueden recibir diplomas.", 422);
  if (registration.category === "desconocida") throw new AdminMutationError("La categoría del equipo no es válida para generar diplomas.", 422);
  const participated = phase === "virtual" ? registration.participacionVirtual : registration.participacionPresencial;
  if (!participated) {
    const phaseLabel = phase === "virtual" ? "virtual" : "presencial";
    throw new AdminMutationError(`El equipo todavía no registra participación en la fase ${phaseLabel}.`, 422);
  }
}

function metadata(files: ParticipantDiploma[]) {
  return files.map((file) => ({
    name: file.fileName,
    contentType: "application/pdf" as const,
    size: file.buffer.length,
    sha256: createHash("sha256").update(file.buffer).digest("hex"),
  }));
}

async function persist({
  id,
  phase,
  operationId,
  updatedBy,
  recipients,
  subject,
  status,
  files,
  messageId,
  errorMessage,
}: {
  id: string;
  phase: DiplomaPhase;
  operationId: string;
  updatedBy: string;
  recipients: NonNullable<ReturnType<typeof resolveVirtualInstructionRecipients>>;
  subject: string;
  status: "sent" | "failed" | "dry_run";
  files?: ParticipantDiploma[];
  messageId?: string;
  errorMessage?: string;
}): Promise<EmailLog> {
  const db = getAdminDb();
  const logRef = db.collection(EMAIL_LOGS_COLLECTION).doc();
  const ref = teamRef(id);
  const attachments = files ? metadata(files) : undefined;
  const statusKey = emailStatusKeyFor(phase);
  await db.runTransaction(async (transaction) => {
    const team = await transaction.get(ref);
    transaction.create(logRef, {
      teamId: id,
      teamName: team.data()?.teamName ?? "",
      emailType: emailTypeFor(phase),
      subject,
      to: recipients.to.email,
      cc: recipients.cc.map((recipient) => recipient.email),
      status,
      createdBy: updatedBy,
      createdAt: FieldValue.serverTimestamp(),
      ...(status === "sent" ? { sentAt: FieldValue.serverTimestamp() } : {}),
      ...(messageId ? { brevoMessageId: messageId } : {}),
      ...(errorMessage ? { errorMessage } : {}),
      ...(attachments ? { attachment: attachments[0], attachments } : {}),
    });
    transaction.update(ref, {
      [`emailStatus.${statusKey}.status`]: status,
      [`emailStatus.${statusKey}.lastAttemptAt`]: FieldValue.serverTimestamp(),
      [`emailStatus.${statusKey}.lastLogId`]: logRef.id,
      ...(status === "sent" ? { [`emailStatus.${statusKey}.lastSentAt`]: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
    transaction.set(outboxRef(phase, operationId), {
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
    teamName: "",
    emailType: emailTypeFor(phase),
    subject,
    to: recipients.to.email,
    cc: recipients.cc.map((recipient) => recipient.email),
    status,
    createdBy: updatedBy,
    attachment: attachments?.[0],
    attachments,
    errorMessage,
    brevoMessageId: messageId,
  };
}

export async function sendTeamDiplomasAsAdmin({
  id,
  phase,
  operationId,
  updatedBy,
  sendEmail = sendBrevoEmail,
}: {
  id: string;
  phase: DiplomaPhase;
  operationId: string;
  updatedBy: string;
  sendEmail?: typeof sendBrevoEmail;
}) {
  const registration = await readRegistration(id);
  assertEligible(registration, phase);
  if (registration.category === "desconocida") throw new AdminMutationError("La categoría del equipo no es válida para generar diplomas.", 422);
  const recipients = resolveVirtualInstructionRecipients(registration);
  if (!recipients) throw new AdminMutationError("El equipo no tiene un correo válido para notificar.", 422);
  const content = buildDiplomaEmailContent(registration, phase);
  const actionOutboxRef = outboxRef(phase, operationId);
  const existing = await actionOutboxRef.get();
  if (existing.exists) {
    const record = existing.data() ?? {};
    if (record.registrationId !== id || record.kind !== `diplomas_${phase}`) throw new AdminMutationError("La operación no coincide con el equipo solicitado.", 409);
    if (record.status === "sent" || record.status === "dry_run") return { registration: await readRegistration(id), alreadyProcessed: true };
    throw new AdminMutationError("Esta operación ya fue procesada. Genera una nueva para reintentar.", 409);
  }
  await actionOutboxRef.create({
    kind: `diplomas_${phase}`,
    registrationId: id,
    phase,
    status: "processing",
    recipientEmail: recipients.to.email,
    ccEmails: recipients.cc.map((recipient) => recipient.email),
    createdBy: updatedBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    attempts: 1,
  });

  let files: ParticipantDiploma[] | undefined;
  try {
    files = await generateTeamDiplomas({ members: registration.members, category: registration.category, phase });
    await assertEmailDeliveryEnabled();
    const result = await sendEmail({
      to: recipients.to,
      cc: recipients.cc,
      ...content,
      attachments: files.map((file) => ({ name: file.fileName, content: file.buffer.toString("base64") })),
      idempotencyKey: operationId,
      sandbox: deliveryMode() === "dry_run",
    });
    const status = deliveryMode() === "live" ? "sent" : "dry_run";
    const log = await persist({ id, phase, operationId, updatedBy, recipients, subject: content.subject, status, files, messageId: result.messageId });
    return { registration: await readRegistration(id), log, alreadyProcessed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible generar o enviar los diplomas.";
    const log = await persist({ id, phase, operationId, updatedBy, recipients, subject: content.subject, status: "failed", files, errorMessage: message });
    throw new AdminMutationError(`No fue posible enviar los diplomas. Se registró el fallo (${log.id}).`, 502);
  }
}
