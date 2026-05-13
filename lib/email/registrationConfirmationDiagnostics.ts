type EnvState = "set" | "missing";
type BrevoApiKeyPrefix = "xkeysib" | "xsmtpsib" | "other" | "missing";

type RegistrationConfirmationEnvStatus = {
  ALLOWED_PUBLIC_ORIGINS: EnvState;
  FIREBASE_PROJECT_ID: EnvState;
  FIREBASE_CLIENT_EMAIL: EnvState;
  FIREBASE_PRIVATE_KEY: EnvState;
  BREVO_API_KEY: EnvState;
  BREVO_API_KEY_PREFIX: BrevoApiKeyPrefix;
  BREVO_REGISTRATION_TEMPLATE_ID: EnvState;
};

function envState(value: string | undefined): EnvState {
  return value?.trim() ? "set" : "missing";
}

function getBrevoApiKeyPrefix(value: string | undefined): BrevoApiKeyPrefix {
  const normalized = value?.trim();
  if (!normalized) return "missing";
  if (normalized.startsWith("xkeysib-")) return "xkeysib";
  if (normalized.startsWith("xsmtpsib-")) return "xsmtpsib";
  return "other";
}

export function getAllowedOrigins() {
  return (process.env.ALLOWED_PUBLIC_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getRegistrationConfirmationEnvStatus(): RegistrationConfirmationEnvStatus {
  const brevoApiKey = process.env.BREVO_API_KEY;

  return {
    ALLOWED_PUBLIC_ORIGINS: envState(process.env.ALLOWED_PUBLIC_ORIGINS),
    FIREBASE_PROJECT_ID: envState(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: envState(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: envState(process.env.FIREBASE_PRIVATE_KEY),
    BREVO_API_KEY: envState(brevoApiKey),
    BREVO_API_KEY_PREFIX: getBrevoApiKeyPrefix(brevoApiKey),
    BREVO_REGISTRATION_TEMPLATE_ID: envState(process.env.BREVO_REGISTRATION_TEMPLATE_ID),
  };
}

export function getRegistrationConfirmationHealthFlags() {
  const env = getRegistrationConfirmationEnvStatus();
  const originsConfigured = getAllowedOrigins().length > 0;
  const firebaseAdminReady =
    env.FIREBASE_PROJECT_ID === "set" &&
    env.FIREBASE_CLIENT_EMAIL === "set" &&
    env.FIREBASE_PRIVATE_KEY === "set";
  const templateIdRaw = process.env.BREVO_REGISTRATION_TEMPLATE_ID?.trim() ?? "";
  const templateId = Number(templateIdRaw);
  const templateIdValid = Number.isInteger(templateId) && templateId > 0;
  const brevoConfigReady =
    env.BREVO_API_KEY === "set" &&
    env.BREVO_API_KEY_PREFIX === "xkeysib" &&
    templateIdValid;

  return {
    env,
    originsConfigured,
    firebaseAdminReady,
    brevoConfigReady,
    templateIdValid,
    ok: originsConfigured && firebaseAdminReady && brevoConfigReady && templateIdValid,
  };
}
