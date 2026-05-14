import { TransactionalEmailType } from "@/lib/email/transactionalEmail";

export type EmailQueueStatus = "pending" | "sent" | "failed" | "cancelled";

export type EmailQueueItem = {
  id?: string;
  teamId: string;
  teamName: string;
  recipientEmail: string;
  recipientName: string;
  emailType: TransactionalEmailType;
  brevoTemplateId: number | null;
  params: Record<string, unknown>;
  status: EmailQueueStatus;
  createdAt?: string;
  createdBy?: string;
  sentAt?: string | null;
  errorMessage?: string | null;
};
