import type { RegistrationCategory } from "@/types/admin/registration";
import type { DiplomaPhase } from "@/lib/diplomas/teamDiplomas";

/**
 * Temporary operational hold: University and AdE onsite diplomas are released
 * manually after the 5 September final. Other diploma flows stay available.
 */
const SUSPENSIONS: Partial<Record<RegistrationCategory, Partial<Record<DiplomaPhase, string>>>> = {
  universidades: { presencial: "Los diplomas de la Final Presencial para Universidades están suspendidos hasta que concluya la jornada." },
  ade: { presencial: "Los diplomas de la Final Presencial para AdE están suspendidos hasta que concluya la jornada." },
};

export function getDiplomaDeliverySuspension(category: RegistrationCategory, phase: DiplomaPhase) {
  return SUSPENSIONS[category]?.[phase] ?? null;
}
