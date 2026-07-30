export const TRANSACTIONAL_EMAIL_TYPES = [
  "registration_confirmation",
  "registration_approved",
  "registration_rejected",
  "correction_required",
  "virtual_instructions",
  "classified_to_onsite",
  "not_classified",
  "finalist",
  "winner",
  "badge_generated",
] as const;

export type TransactionalEmailType = (typeof TRANSACTIONAL_EMAIL_TYPES)[number];

export const BREVO_TEMPLATE_ENV_BY_EMAIL_TYPE: Record<
  TransactionalEmailType,
  string | null
> = {
  registration_confirmation: "BREVO_REGISTRATION_TEMPLATE_ID",
  registration_approved: null,
  registration_rejected: null,
  correction_required: null,
  virtual_instructions: null,
  classified_to_onsite: "BREVO_CLASSIFIED_TO_ONSITE_TEMPLATE_ID",
  not_classified: "BREVO_NOT_CLASSIFIED_TEMPLATE_ID",
  finalist: "BREVO_FINALIST_TEMPLATE_ID",
  winner: "BREVO_WINNER_TEMPLATE_ID",
  badge_generated: null,
};

export function getBrevoTemplateIdForEmailType(
  type: TransactionalEmailType,
): number | null {
  const envKey = BREVO_TEMPLATE_ENV_BY_EMAIL_TYPE[type];
  if (!envKey) {
    return null;
  }

  const rawValue = process.env[envKey]?.trim();
  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
