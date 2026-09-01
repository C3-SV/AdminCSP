import type { RegistrationDocument } from "@/types/admin/registration";
import { getFinalInstructionsConfig } from "@/lib/email/finalInstructionsConfig";

export function getFinalInstructionsEligibilityError(registration: Pick<RegistrationDocument, "category" | "estadoCompetitivo" | "laboratorioAsignado">) {
  if (registration.category === "desconocida" || !getFinalInstructionsConfig(registration.category)) return "Las indicaciones finales están disponibles sólo para Colegios, Universidades y AdE.";
  if (registration.estadoCompetitivo !== "clasificado") return "Sólo los equipos clasificados pueden recibir las indicaciones finales.";
  if (!registration.laboratorioAsignado) return "Asigna un laboratorio antes de enviar las indicaciones finales.";
  return null;
}
