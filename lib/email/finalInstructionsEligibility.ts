import type { RegistrationDocument } from "@/types/admin/registration";

export function getFinalInstructionsEligibilityError(registration: Pick<RegistrationDocument, "category" | "estadoCompetitivo" | "laboratorioAsignado">) {
  if (registration.category !== "colegios") return "Las indicaciones finales actuales están disponibles sólo para Colegios.";
  if (registration.estadoCompetitivo !== "clasificado") return "Sólo los equipos clasificados pueden recibir las indicaciones finales.";
  if (!registration.laboratorioAsignado) return "Asigna un laboratorio antes de enviar las indicaciones finales.";
  return null;
}
