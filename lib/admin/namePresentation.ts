import type { RegistrationDocumentMember } from "@/types/admin/registration";
import { compactVirtualCardText } from "@/lib/cards/virtualCardLayout";

function clean(value: string | undefined) {
  return compactVirtualCardText(value ?? "");
}

/** Consistent short name for cards: first given name + first surname, preserving accents. */
export function getParticipantShortName(member: Pick<RegistrationDocumentMember, "firstName" | "lastName">) {
  const firstName = clean(member.firstName);
  const lastName = clean(member.lastName);
  if (firstName && lastName) return `${firstName.split(" ")[0]} ${lastName.split(" ")[0]}`;
  const parts = clean(`${firstName} ${lastName}`).split(" ").filter(Boolean);
  if (parts.length <= 2) return parts.join(" ");
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
