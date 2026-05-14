import { getBrevoTemplateIdForEmailType, TransactionalEmailType } from "@/lib/email/transactionalEmail";
import { EmailQueueItem } from "@/types/admin/emailQueue";

type BuildEmailQueueDraftInput = {
  teamId: string;
  teamName: string;
  recipientEmail: string;
  recipientName: string;
  emailType: TransactionalEmailType;
  params?: Record<string, unknown>;
  createdBy?: string;
};

export function buildEmailQueueDraft({
  teamId,
  teamName,
  recipientEmail,
  recipientName,
  emailType,
  params = {},
  createdBy,
}: BuildEmailQueueDraftInput): EmailQueueItem {
  return {
    teamId,
    teamName,
    recipientEmail,
    recipientName,
    emailType,
    brevoTemplateId: getBrevoTemplateIdForEmailType(emailType),
    params,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdBy,
    sentAt: null,
    errorMessage: null,
  };
}

// TODO: Integrate persistence (e.g. Firestore `emailQueue`) via a controlled server route.
// For now this module prepares typed drafts only, so status/fase updates remain safe.
