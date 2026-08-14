import type { RegistrationDocument } from "@/types/admin/registration";

export function getFinalInstructionsEligibilityError(registration: Pick<RegistrationDocument, "estadoCompetitivo" | "laboratorioAsignado">) {
  if (registration.estadoCompetitivo !== "clasificado") return "Sólo los equipos clasificados pueden recibir las indicaciones finales.";
  if (!registration.laboratorioAsignado) return "Asigna un laboratorio antes de enviar las indicaciones finales.";
  return null;
}
