import "server-only";

import type { RegistrationDocument } from "@/types/admin/registration";
import { isValidEmail, type TeamEmailRecipient, type TeamEmailRecipients } from "@/lib/email/teamRecipients";

function normalized(email: string) {
  return email.trim().toLowerCase();
}

function personName(firstName?: string, lastName?: string) {
  const name = `${firstName?.trim() ?? ""} ${lastName?.trim() ?? ""}`.trim();
  return name || undefined;
}

/** Virtual instructions prioritize the registered responsible person over general contact data. */
export function resolveVirtualInstructionRecipients(
  registration: RegistrationDocument,
  operationsCc = process.env.CSP_EMAIL_OPERATIONS_CC,
): TeamEmailRecipients | null {
  const candidates: TeamEmailRecipient[] = [];
  if (isValidEmail(registration.responsible?.email)) {
    candidates.push({
      email: normalized(registration.responsible.email),
      name: personName(registration.responsible.firstName, registration.responsible.lastName),
    });
  }
  if (isValidEmail(registration.contactEmail)) {
    candidates.push({ email: normalized(registration.contactEmail) });
  }
  registration.members.forEach((member) => {
    if (isValidEmail(member.email)) {
      candidates.push({
        email: normalized(member.email),
        name: personName(member.firstName, member.lastName),
      });
    }
  });

  if (isValidEmail(operationsCc)) {
    candidates.push({ email: normalized(operationsCc), name: "Copa C3" });
  }

  const unique = candidates.filter(
    (candidate, index) => candidates.findIndex((item) => item.email === candidate.email) === index,
  );
  const [to, ...cc] = unique;
  return to ? { to, cc } : null;
}
