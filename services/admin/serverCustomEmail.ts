import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { assertEmailDeliveryEnabled } from "@/lib/email/emailDeliveryControl";
import { buildCustomEmailContent, CustomEmailContentError } from "@/lib/email/customEmailContent";
import { CustomEmailRecipientError, validateCustomEmailRecipients } from "@/lib/email/customEmailRecipients";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import { getAdminDb } from "@/lib/firebase/admin";
import { AdminMutationError } from "@/services/admin/serverRegistrationActions";
import type { EmailLog } from "@/types/admin/email";

export type CustomEmailInput = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  content: string;
};

type CustomEmailOutboxRecord = {
  kind?: unknown;
  status?: unknown;
};

export type CustomEmailAuditResult = {
  operationId: string;
  updatedBy: string;
  subject: string;
  to: string[];
  cc: string[];
  bcc: string[];
  status: "sent" | "failed" | "dry_run";
  messageId?: string;
  errorMessage?: string;
};

export type CustomEmailServiceDependencies = {
  assertDeliveryEnabled: () => Promise<unknown>;
  assertSenderConfigured: () => void;
  getDeliveryMode: () => "live" | "dry_run";
  readOutbox: (operationId: string) => Promise<CustomEmailOutboxRecord | null>;
  createOutbox: (operationId: string, data: Omit<CustomEmailAuditResult, "status">) => Promise<void>;
  persistResult: (result: CustomEmailAuditResult) => Promise<EmailLog>;
  sendEmail: typeof sendBrevoEmail;
};

function outboxRef(operationId: string) {
  return getAdminDb().collection("emailOutbox").doc(`custom_${operationId}`);
}

function defaultDependencies(): CustomEmailServiceDependencies {
  return {
    assertDeliveryEnabled: assertEmailDeliveryEnabled,
    assertSenderConfigured: () => {
      if (!process.env.BREVO_SENDER_EMAIL?.trim()) {
        throw new AdminMutationError("Configura BREVO_SENDER_EMAIL con el correo no-reply antes de enviar.", 503);
      }
    },
    getDeliveryMode: () => process.env.CSP_EMAIL_DELIVERY_MODE === "live" ? "live" : "dry_run",
    readOutbox: async (operationId) => {
      const snapshot = await outboxRef(operationId).get();
      return snapshot.exists ? snapshot.data() ?? {} : null;
    },
    createOutbox: async (operationId, data) => {
      await outboxRef(operationId).create({
        kind: "custom",
        status: "processing",
        subject: data.subject,
        toEmails: data.to,
        ccEmails: data.cc,
        bccEmails: data.bcc,
        createdBy: data.updatedBy,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    },
    persistResult: async (result) => {
      const db = getAdminDb();
      const logRef = db.collection("email_logs").doc();
      await db.runTransaction(async (transaction) => {
        transaction.create(logRef, {
          emailType: "custom",
          subject: result.subject,
          to: result.to[0] ?? "",
          toEmails: result.to,
          cc: result.cc,
          bcc: result.bcc,
          status: result.status,
          createdBy: result.updatedBy,
          createdAt: FieldValue.serverTimestamp(),
          ...(result.status === "sent" ? { sentAt: FieldValue.serverTimestamp() } : {}),
          ...(result.messageId ? { brevoMessageId: result.messageId } : {}),
          ...(result.errorMessage ? { errorMessage: result.errorMessage } : {}),
        });
        transaction.set(outboxRef(result.operationId), {
          status: result.status,
          logId: logRef.id,
          updatedAt: FieldValue.serverTimestamp(),
          ...(result.messageId ? { brevoMessageId: result.messageId } : {}),
          ...(result.errorMessage ? { lastError: result.errorMessage } : {}),
        }, { merge: true });
      });
      return {
        id: logRef.id,
        emailType: "custom",
        subject: result.subject,
        to: result.to[0] ?? "",
        toEmails: result.to,
        cc: result.cc,
        bcc: result.bcc,
        status: result.status,
        createdBy: result.updatedBy,
        brevoMessageId: result.messageId,
        errorMessage: result.errorMessage,
      };
    },
    sendEmail: sendBrevoEmail,
  };
}

export async function sendCustomEmailAsAdmin({
  operationId,
  updatedBy,
  input,
  dependencies = defaultDependencies(),
}: {
  operationId: string;
  updatedBy: string;
  input: CustomEmailInput;
  dependencies?: CustomEmailServiceDependencies;
}) {
  let recipients;
  let content;
  try {
    recipients = validateCustomEmailRecipients(input);
    content = buildCustomEmailContent(input);
  } catch (error) {
    if (error instanceof CustomEmailRecipientError || error instanceof CustomEmailContentError) {
      throw new AdminMutationError(error.message, 422);
    }
    throw error;
  }
  const existing = await dependencies.readOutbox(operationId);
  if (existing) {
    if (existing.kind !== "custom") {
      throw new AdminMutationError("La operación no corresponde a un correo personalizado.", 409);
    }
    if (existing.status === "sent" || existing.status === "dry_run") {
      return { alreadyProcessed: true as const };
    }
    throw new AdminMutationError("Esta operación ya fue procesada. Genera una nueva para reintentar.", 409);
  }

  const auditBase = {
    operationId,
    updatedBy,
    subject: content.subject,
    to: recipients.to,
    cc: recipients.cc,
    bcc: recipients.bcc,
  };
  await dependencies.createOutbox(operationId, auditBase);

  try {
    await dependencies.assertDeliveryEnabled();
    dependencies.assertSenderConfigured();
    const mode = dependencies.getDeliveryMode();
    const response = await dependencies.sendEmail({
      to: recipients.to.map((email) => ({ email })),
      cc: recipients.cc.map((email) => ({ email })),
      bcc: recipients.bcc.map((email) => ({ email })),
      subject: content.subject,
      htmlContent: content.htmlContent,
      textContent: content.textContent,
      idempotencyKey: operationId,
      sandbox: mode === "dry_run",
    });
    const log = await dependencies.persistResult({
      ...auditBase,
      status: mode === "live" ? "sent" : "dry_run",
      messageId: response.messageId,
    });
    return { log, alreadyProcessed: false as const };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "No fue posible enviar el correo personalizado.";
    const log = await dependencies.persistResult({
      ...auditBase,
      status: "failed",
      errorMessage,
    });
    throw new AdminMutationError(`No fue posible enviar el correo personalizado. Se registró el fallo (${log.id}).`, 502);
  }
}
