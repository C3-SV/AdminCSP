import type { RegistrationDocument } from "@/types/admin/registration";
import { formatPersonName } from "@/utils/admin";

export function getInstitutionDisplay(registration: RegistrationDocument) {
  return registration.category === "ade" ? "AdE" : registration.institution.trim() || "-";
}

export function getResponsibleOrContactDisplay(registration: RegistrationDocument) {
  return (
    formatPersonName(registration.responsible?.firstName, registration.responsible?.lastName) ||
    registration.contactEmail?.trim() ||
    "-"
  );
}
