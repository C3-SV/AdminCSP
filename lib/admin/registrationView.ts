import type {
  CompetitivePhase,
  CompetitiveStatus,
  RegistrationDocument,
} from "@/types/admin/registration";

export type DisplayCompetitivePhase = CompetitivePhase | "pendiente";
export type DisplayCompetitiveStatus = CompetitiveStatus | "pendiente";

export type RegistrationCompetitiveView = {
  faseActualMostrada: DisplayCompetitivePhase;
  estadoCompetitivoMostrado: DisplayCompetitiveStatus;
  defaultsAplicados: {
    faseActual: boolean;
    estadoCompetitivo: boolean;
  };
};

/** Displays persisted competitive data independently from registration approval. */
export function resolveRegistrationCompetitiveView(
  registration: RegistrationDocument,
): RegistrationCompetitiveView {
  const hasStoredPhase = Boolean(registration.faseActual);
  const hasStoredStatus = Boolean(registration.estadoCompetitivo);
  const phase = registration.faseActual === "final" ? "presencial" : registration.faseActual;
  const status = registration.estadoCompetitivo === "participando"
    ? "pendiente"
    : registration.estadoCompetitivo === "finalista" || registration.estadoCompetitivo === "ganador"
      ? "clasificado"
      : registration.estadoCompetitivo === "eliminado" ? "no_clasificado" : registration.estadoCompetitivo;

  return {
    faseActualMostrada: phase ?? "pendiente",
    estadoCompetitivoMostrado: status ?? "pendiente",
    defaultsAplicados: {
      faseActual: !hasStoredPhase,
      estadoCompetitivo: !hasStoredStatus,
    },
  };
}
