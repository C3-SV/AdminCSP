import "server-only";

import type { RegistrationDocument } from "@/types/admin/registration";

export type TeamEmailRecipient = {
  email: string;
  name?: string;
};

export type TeamEmailRecipients = {
  to: TeamEmailRecipient;
  cc: TeamEmailRecipient[];
};

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function nameOf(firstName?: string, lastName?: string) {
  const name = `${firstName?.trim() ?? ""} ${lastName?.trim() ?? ""}`.trim();
  return name || undefined;
}

export function resolveTeamEmailRecipients(
  registration: RegistrationDocument,
): TeamEmailRecipients | null {
  const candidates: TeamEmailRecipient[] = [];
  if (isValidEmail(registration.contactEmail)) {
    candidates.push({ email: normalizeEmail(registration.contactEmail) });
  }
  if (isValidEmail(registration.responsible?.email)) {
    candidates.push({
      email: normalizeEmail(registration.responsible.email),
      name: nameOf(registration.responsible.firstName, registration.responsible.lastName),
    });
  }
  registration.members.forEach((member) => {
    if (isValidEmail(member.email)) {
      candidates.push({
        email: normalizeEmail(member.email),
        name: nameOf(member.firstName, member.lastName),
      });
    }
  });

  const uniqueRecipients = candidates.filter(
    (candidate, index) =>
      candidates.findIndex((current) => current.email === candidate.email) === index,
  );
  const [to, ...cc] = uniqueRecipients;
  return to ? { to, cc } : null;
}
