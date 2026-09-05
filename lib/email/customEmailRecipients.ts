export type CustomEmailRecipientFields = {
  to: string;
  cc?: string;
  bcc?: string;
};

export type ParsedRecipientField = {
  recipients: string[];
  invalid: string[];
};

export type ResolvedCustomEmailRecipients = {
  to: string[];
  cc: string[];
  bcc: string[];
  invalid: {
    to: string[];
    cc: string[];
    bcc: string[];
  };
};

export class CustomEmailRecipientError extends Error {}

const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

export function parseRecipientField(value: string): ParsedRecipientField {
  const recipients: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const token of value.split(/[,;\r\n]+/)) {
    const normalized = token.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    if (normalized.length <= 254 && EMAIL_PATTERN.test(normalized)) recipients.push(normalized);
    else invalid.push(token.trim());
  }

  return { recipients, invalid };
}

export function resolveCustomEmailRecipients(
  fields: CustomEmailRecipientFields,
): ResolvedCustomEmailRecipients {
  const parsed = {
    to: parseRecipientField(fields.to),
    cc: parseRecipientField(fields.cc ?? ""),
    bcc: parseRecipientField(fields.bcc ?? ""),
  };
  const seen = new Set<string>();
  const unique = (emails: string[]) => emails.filter((email) => {
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  return {
    to: unique(parsed.to.recipients),
    cc: unique(parsed.cc.recipients),
    bcc: unique(parsed.bcc.recipients),
    invalid: {
      to: parsed.to.invalid,
      cc: parsed.cc.invalid,
      bcc: parsed.bcc.invalid,
    },
  };
}

export function validateCustomEmailRecipients(
  fields: CustomEmailRecipientFields,
): ResolvedCustomEmailRecipients {
  const resolved = resolveCustomEmailRecipients(fields);
  if (!resolved.to.length) {
    throw new CustomEmailRecipientError("El campo Para necesita al menos un correo válido.");
  }
  const invalidEntries = Object.entries(resolved.invalid).filter(([, values]) => values.length);
  if (invalidEntries.length) {
    const details = invalidEntries
      .map(([field, values]) => `${field === "to" ? "Para" : field === "cc" ? "CC" : "CCO"}: ${values.join(", ")}`)
      .join(" · ");
    throw new CustomEmailRecipientError(`Corrige los correos inválidos. ${details}`);
  }
  return resolved;
}
