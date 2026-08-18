import type { RegistrationDocument } from "@/types/admin/registration";

export type DiplomaEmailPhase = "virtual" | "presencial";

export type DiplomaEmailScenario =
  | "virtual_participacion"
  | "virtual_clasificado_final"
  | "presencial_final";

export function getDiplomaEmailScenario(
  registration: Pick<RegistrationDocument, "category" | "estadoCompetitivo" | "participacionPresencial">,
  phase: DiplomaEmailPhase,
): DiplomaEmailScenario {
  if (phase === "presencial") return "presencial_final";

  const isUniversityOrAde = registration.category === "universidades" || registration.category === "ade";
  if (isUniversityOrAde && registration.estadoCompetitivo === "clasificado" && !registration.participacionPresencial) {
    return "virtual_clasificado_final";
  }

  return "virtual_participacion";
}

export function getDiplomaEmailScenarioLabel(scenario: DiplomaEmailScenario) {
  return {
    virtual_participacion: "Mensaje de agradecimiento por participación en la Fase Virtual.",
    virtual_clasificado_final: "Mensaje para equipo clasificado: incluye “Nos vemos el 5 de septiembre en la Final Presencial”.",
    presencial_final: "Mensaje de agradecimiento por participación en la Final Presencial.",
  }[scenario];
}
