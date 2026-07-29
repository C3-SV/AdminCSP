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

  return {
    faseActualMostrada: registration.faseActual ?? "pendiente",
    estadoCompetitivoMostrado: registration.estadoCompetitivo ?? "pendiente",
    defaultsAplicados: {
      faseActual: !hasStoredPhase,
      estadoCompetitivo: !hasStoredStatus,
    },
  };
}
