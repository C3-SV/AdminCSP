import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import {
  COMPETITIVE_ACTIONS,
  CompetitiveActionKey,
} from "@/lib/admin/competitiveActions";
import { resolveTeamEmailRecipients } from "@/lib/email/teamRecipients";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import { getBrevoTemplateIdForEmailType } from "@/lib/email/transactionalEmail";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  mapRegistrationFromFirestore,
} from "@/services/admin/registrations";
import { RegistrationDocument, RegistrationStatus } from "@/types/admin/registration";

const REGISTRATIONS_COLLECTION = "registrations";
const EMAIL_OUTBOX_COLLECTION = "emailOutbox";

export class AdminMutationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function registrationRef(id: string) {
  return getAdminDb().collection(REGISTRATIONS_COLLECTION).doc(id);
}

function auditPayload(updatedBy: string) {
  return {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy,
  };
}

function toRegistration(snapshot: FirebaseFirestore.DocumentSnapshot): RegistrationDocument {
  if (!snapshot.exists) {
    throw new AdminMutationError("No se encontró el equipo solicitado.", 404);
  }
  return mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {});
}

async function readRegistration(id: string) {
  return toRegistration(await registrationRef(id).get());
}

export async function updateRegistrationStatusAsAdmin({
  id,
  status,
  adminNotes,
  updatedBy,
}: {
  id: string;
  status: RegistrationStatus;
  adminNotes: string;
  updatedBy: string;
}) {
  const ref = registrationRef(id);
  const current = await ref.get();
  toRegistration(current);
  await ref.update({ status, adminNotes, ...auditPayload(updatedBy) });
  return readRegistration(id);
}

function outboxRef(operationId: string) {
  return getAdminDb().collection(EMAIL_OUTBOX_COLLECTION).doc(`admin_${operationId}`);
}

function getEmailParams(
  registration: RegistrationDocument,
  action: CompetitiveActionKey,
) {
  const selectedAction = COMPETITIVE_ACTIONS[action];
  return {
    TEAM_NAME: registration.teamName,
    INSTITUTION: registration.institution || "",
    CATEGORY_LABEL:
      registration.category === "ade"
        ? "AdE"
        : registration.category === "colegios"
          ? "Colegios"
          : registration.category === "universidades"
            ? "Universidades"
            : "No reconocida",
    ACTION_LABEL: selectedAction.label,
    PHASE_LABEL: selectedAction.faseActual,
    STATUS_LABEL: selectedAction.estadoCompetitivo,
  };
}

async function markOutboxFailed(operationId: string, error: unknown) {
  await outboxRef(operationId).set(
    {
      status: "failed",
      lastError: error instanceof Error ? error.message : "No fue posible enviar el correo.",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

async function persistActionAfterEmail({
  id,
  action,
  operationId,
  updatedBy,
}: {
  id: string;
  action: CompetitiveActionKey;
  operationId: string;
  updatedBy: string;
}) {
  const actionDefinition = COMPETITIVE_ACTIONS[action];
  const teamRef = registrationRef(id);
  const actionOutboxRef = outboxRef(operationId);

  await getAdminDb().runTransaction(async (transaction) => {
    const teamSnapshot = await transaction.get(teamRef);
    toRegistration(teamSnapshot);
    transaction.update(teamRef, {
      faseActual: actionDefinition.faseActual,
      estadoCompetitivo: actionDefinition.estadoCompetitivo,
      ...auditPayload(updatedBy),
    });
    transaction.set(
      actionOutboxRef,
      {
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastError: FieldValue.delete(),
      },
      { merge: true },
    );
  });
}

export async function applyCompetitiveActionAsAdmin({
  id,
  action,
  operationId,
  updatedBy,
  sendEmail = sendBrevoEmail,
}: {
  id: string;
  action: CompetitiveActionKey;
  operationId: string;
  updatedBy: string;
  sendEmail?: typeof sendBrevoEmail;
}) {
  const actionDefinition = COMPETITIVE_ACTIONS[action];
  const teamRef = registrationRef(id);

  if (!actionDefinition.emailType) {
    const current = await teamRef.get();
    toRegistration(current);
    await teamRef.update({
      faseActual: actionDefinition.faseActual,
      estadoCompetitivo: actionDefinition.estadoCompetitivo,
      ...auditPayload(updatedBy),
    });
    return { registration: await readRegistration(id), emailSent: false };
  }

  const current = await readRegistration(id);
  const recipients = resolveTeamEmailRecipients(current);
  if (!recipients) {
    throw new AdminMutationError(
      "El equipo no tiene un correo principal o de integrante válido para notificar.",
      422,
    );
  }

  const templateId = getBrevoTemplateIdForEmailType(actionDefinition.emailType);
  if (!templateId) {
    throw new AdminMutationError(
      "No está configurada la plantilla de correo para esta acción. El estado no fue modificado.",
      503,
    );
  }

  const actionOutboxRef = outboxRef(operationId);
  const existing = await actionOutboxRef.get();
  if (existing.exists) {
    const record = existing.data() ?? {};
    if (record.registrationId !== id || record.action !== action) {
      throw new AdminMutationError("La operación no coincide con el equipo o acción solicitada.", 409);
    }
    if (record.status === "sent") {
      return { registration: await readRegistration(id), emailSent: true };
    }
    if (record.status === "email_sent_state_pending") {
      await persistActionAfterEmail({ id, action, operationId, updatedBy });
      return { registration: await readRegistration(id), emailSent: true };
    }
  } else {
    await actionOutboxRef.create({
      kind: "admin_competitive_action",
      registrationId: id,
      teamName: current.teamName,
      action,
      emailType: actionDefinition.emailType,
      status: "processing",
      recipientEmail: recipients.to.email,
      ccEmails: recipients.cc.map((recipient) => recipient.email),
      templateId,
      createdBy: updatedBy,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      attempts: 0,
    });
  }

  try {
    await actionOutboxRef.set(
      { status: "processing", attempts: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await sendEmail({
      to: recipients.to,
      cc: recipients.cc,
      templateId,
      params: getEmailParams(current, action),
      idempotencyKey: operationId,
    });
  } catch (error) {
    await markOutboxFailed(operationId, error);
    throw new AdminMutationError(
      "No fue posible enviar el correo requerido. El estado del equipo no fue modificado.",
      502,
    );
  }

  try {
    await actionOutboxRef.set(
      { status: "email_sent_state_pending", updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    await persistActionAfterEmail({ id, action, operationId, updatedBy });
  } catch (error) {
    await actionOutboxRef.set(
      {
        status: "email_sent_state_pending",
        lastError: error instanceof Error ? error.message : "No fue posible guardar el estado.",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    throw new AdminMutationError(
      "El correo fue aceptado, pero no se pudo confirmar el cambio. Reintenta la misma acción.",
      500,
    );
  }

  return { registration: await readRegistration(id), emailSent: true };
}
