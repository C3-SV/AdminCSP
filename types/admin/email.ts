export const EMAIL_DELIVERY_STATUSES = ["not_sent", "sent", "failed", "dry_run"] as const;

export type EmailDeliveryStatus = (typeof EMAIL_DELIVERY_STATUSES)[number];

export type EmailStatusEntry = {
  status: EmailDeliveryStatus;
  lastAttemptAt?: string;
  lastSentAt?: string;
  lastLogId?: string;
};

export type RegistrationEmailStatus = {
  virtualInstructions: EmailStatusEntry;
  classifiedToOnsite: EmailStatusEntry;
  notClassified: EmailStatusEntry;
};

export type EmailLogType =
  | "virtual_instructions"
  | "classified_to_onsite"
  | "not_classified"
  | "finalist"
  | "winner";

export type EmailLog = {
  id: string;
  teamId: string;
  teamName: string;
  emailType: EmailLogType;
  subject: string;
  to: string;
  cc: string[];
  status: Exclude<EmailDeliveryStatus, "not_sent">;
  brevoMessageId?: string;
  attachment?: {
    name: string;
    contentType: "image/png";
    size: number;
    sha256: string;
  };
  errorMessage?: string;
  createdBy: string;
  createdAt?: string;
  sentAt?: string;
};

export const EMPTY_EMAIL_STATUS: RegistrationEmailStatus = {
  virtualInstructions: { status: "not_sent" },
  classifiedToOnsite: { status: "not_sent" },
  notClassified: { status: "not_sent" },
};
